"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const dialog = $("#content-dialog");
const dialogBody = $("#dialog-body");
let currentTool = null;
let toastTimeout;

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 4500);
}

function openDialog(markup, tool = null) {
  currentTool = tool;
  dialogBody.innerHTML = markup;
  dialog.showModal();
  document.body.classList.add("dialog-open");
  dialog.scrollTop = 0;
}

$(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  currentTool = null;
  document.body.classList.remove("dialog-open");
});

// A timestamp-based timer remains accurate when a browser tab sleeps.
const timer = {
  duration: 25 * 60,
  remaining: 25 * 60,
  running: false,
  endAt: 0,
  mode: "focus",
};
let timerInterval = null;

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function renderTimer() {
  if (currentTool !== "focus") return;
  $("#timer-display").textContent = formatTime(timer.remaining);
  $("#timer-start").textContent = timer.running
    ? "暂停一下"
    : timer.remaining === 0
      ? "再来一次"
      : timer.remaining === timer.duration
        ? "开始专注"
        : "继续计时";
  if (
    !timer.running &&
    timer.mode === "break" &&
    timer.remaining === timer.duration
  )
    $("#timer-start").textContent = "开始休息";
  $("#timer-caption").textContent =
    timer.remaining === 0
      ? timer.mode === "focus"
        ? "做得很好，给自己一个小休息吧。"
        : "休息结束，带着好心情继续吧。"
      : timer.running
        ? timer.mode === "focus"
          ? "只专心做好眼前这一件事。"
          : "伸个懒腰，让眼睛休息一下。"
        : "准备好了，就从这一刻开始。";
  $$(".timer-modes button").forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.mode === timer.mode),
    ),
  );
  const progress = timer.duration - timer.remaining;
  $("#timer-progress").textContent =
    `${timer.mode === "focus" ? "专注" : "休息"}进度 ${Math.floor((progress / timer.duration) * 100)}%`;
}

function tickTimer() {
  if (!timer.running) return;
  timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
  if (timer.remaining === 0) {
    timer.running = false;
    clearInterval(timerInterval);
    timerInterval = null;
    notify(
      timer.mode === "focus"
        ? "25 分钟完成啦！辛苦了，休息一下吧 ♡"
        : "休息结束，带着好心情继续吧 ♡",
    );
  }
  renderTimer();
}

function showFocus() {
  openDialog(
    `<span class="eyebrow">A LITTLE TIME FOR ONE THING</span><h2 id="dialog-title" class="dialog-title">专注时光</h2><p class="dialog-description">不着急，把事情一件一件做好。</p><div class="timer-modes" aria-label="计时模式"><button type="button" data-mode="focus" aria-pressed="true">专注 25 分钟</button><button type="button" data-mode="break" aria-pressed="false">休息 5 分钟</button></div><div class="timer-display" id="timer-display" role="timer" aria-label="剩余时间">25:00</div><p id="timer-caption" class="timer-caption"></p><div class="timer-actions"><button id="timer-start" class="button button-primary" type="button">开始专注</button><button id="timer-reset" class="button button-secondary" type="button">重置</button></div><p class="timer-status"><span id="timer-progress"></span> · 关闭弹窗后仍会计时，刷新页面会重置。</p>`,
    "focus",
  );
  renderTimer();
  $("#timer-start").addEventListener("click", () => {
    if (timer.running) {
      tickTimer();
      timer.running = false;
      clearInterval(timerInterval);
      timerInterval = null;
    } else {
      if (timer.remaining === 0) timer.remaining = timer.duration;
      timer.endAt = Date.now() + timer.remaining * 1000;
      timer.running = true;
      timerInterval = setInterval(tickTimer, 250);
    }
    renderTimer();
  });
  $("#timer-reset").addEventListener("click", resetTimer);
  $$(".timer-modes button").forEach((button) =>
    button.addEventListener("click", () => {
      timer.mode = button.dataset.mode;
      timer.duration = timer.mode === "focus" ? 25 * 60 : 5 * 60;
      resetTimer();
    }),
  );
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timer.running = false;
  timer.remaining = timer.duration;
  renderTimer();
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tickTimer();
});

// Only this device's list is saved; no server or personal data collection.
const TODO_KEY = "xuanying-little-world-todos-v1";
let storageAvailable = true;
let todos = [];
try {
  const saved = JSON.parse(localStorage.getItem(TODO_KEY) || "[]");
  if (Array.isArray(saved)) {
    const ids = new Set();
    todos = saved
      .filter((item) => {
        if (
          !item ||
          typeof item.id !== "string" ||
          typeof item.text !== "string" ||
          !item.text.trim() ||
          ids.has(item.id)
        )
          return false;
        ids.add(item.id);
        return true;
      })
      .slice(0, 100)
      .map((item) => ({
        id: item.id,
        text: item.text.slice(0, 120),
        done: item.done === true,
      }));
  }
} catch {
  storageAvailable = false;
}

function saveTodos() {
  try {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  const note = $("#todo-storage-note");
  if (note)
    note.textContent = storageAvailable
      ? "清单只保存在当前浏览器。换设备或清除浏览器数据后不会保留。"
      : "浏览器暂时无法保存，清单只会保留到本次页面关闭。";
}

function renderTodos() {
  const list = $("#todo-list");
  list.replaceChildren();
  if (todos.length === 0) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = "今天想完成什么？从一件小事开始吧。";
    list.append(empty);
  }
  todos.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = `todo-row${item.done ? " done" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `task-${index}`;
    checkbox.checked = item.done;
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = item.text;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "todo-delete";
    remove.setAttribute("aria-label", `删除：${item.text}`);
    remove.textContent = "×";
    checkbox.addEventListener("change", () => {
      item.done = checkbox.checked;
      row.classList.toggle("done", item.done);
      saveTodos();
      renderTodoSummary();
    });
    remove.addEventListener("click", () => {
      todos = todos.filter((todo) => todo.id !== item.id);
      saveTodos();
      renderTodos();
      const next = $$(".todo-delete")[Math.min(index, todos.length - 1)];
      (next || $("#todo-input")).focus();
    });
    row.append(checkbox, label, remove);
    list.append(row);
  });
  renderTodoSummary();
}

function renderTodoSummary() {
  const complete = todos.filter((item) => item.done).length;
  $("#todo-summary").textContent = todos.length
    ? `已完成 ${complete} / ${todos.length} 项${complete === todos.length ? " · 今日的小目标都完成啦 ♡" : " · 每一步都算数"}`
    : "一张空白清单，一个新的开始。";
}

function showTodos() {
  openDialog(
    `<span class="eyebrow">ONE LITTLE THING AT A TIME</span><h2 id="dialog-title" class="dialog-title">今日小清单</h2><p class="dialog-description">写下来，慢慢完成，不忘给自己一点鼓励。</p><form id="todo-form" class="todo-form"><label class="visually-hidden" for="todo-input">添加待办事项</label><input id="todo-input" name="task" placeholder="写下一件想完成的小事…" maxlength="120" autocomplete="off" required><button class="button button-primary" type="submit">添加</button></form><ul id="todo-list" class="todo-list" aria-label="待办事项"></ul><p id="todo-summary" class="todo-summary" role="status" aria-live="polite"></p><p id="todo-storage-note" class="dialog-body-note"></p>`,
    "todo",
  );
  $("#todo-storage-note").textContent = storageAvailable
    ? "清单只保存在当前浏览器。换设备或清除浏览器数据后不会保留。"
    : "浏览器暂时无法保存，清单只会保留到本次页面关闭。";
  renderTodos();
  $("#todo-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#todo-input");
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity("先写下一件小事吧。");
      input.reportValidity();
      return;
    }
    if (todos.length >= 100) {
      notify("先完成或移除一些事项吧，清单最多保留 100 项。");
      return;
    }
    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    todos.push({ id, text, done: false });
    saveTodos();
    renderTodos();
    input.value = "";
    input.focus();
  });
  $("#todo-input").addEventListener("input", (event) =>
    event.target.setCustomValidity(""),
  );
  $("#todo-input").focus();
}

let textDraft = "";
function countText(value) {
  return {
    total: Array.from(value).length,
    compact: Array.from(value.replace(/\s/gu, "")).length,
    chinese: (value.match(/\p{Script=Han}/gu) || []).length,
    english: (value.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length,
  };
}

function showText() {
  openDialog(
    `<span class="eyebrow">EVERY LITTLE WORD COUNTS</span><h2 id="dialog-title" class="dialog-title">文字小助手</h2><p class="dialog-description">写通知、整理文案，字数一眼就知道。</p><label class="field-label" for="text-input">输入或粘贴文字</label><textarea id="text-input" class="text-area" placeholder="把文字放在这里，统计会实时更新…" maxlength="20000"></textarea><div class="text-stats" aria-live="polite" aria-atomic="true"><div class="stat-item"><strong id="count-total">0</strong><span>总字符</span></div><div class="stat-item"><strong id="count-compact">0</strong><span>不含空白</span></div><div class="stat-item"><strong id="count-chinese">0</strong><span>中文字符</span></div><div class="stat-item"><strong id="count-english">0</strong><span>英文单词</span></div></div><button id="text-clear" class="text-clear" type="button">清空文字</button><p class="dialog-body-note">总字符包含空格和换行；文字仅在本页处理，刷新后清空。最多输入 20,000 字符。</p>`,
    "text",
  );
  const input = $("#text-input");
  input.value = textDraft;
  const update = () => {
    textDraft = input.value;
    const counts = countText(textDraft);
    Object.entries(counts).forEach(([key, value]) => {
      $(`#count-${key}`).textContent = value.toLocaleString("zh-CN");
    });
  };
  input.addEventListener("input", update);
  $("#text-clear").addEventListener("click", () => {
    input.value = "";
    update();
    input.focus();
  });
  update();
  input.focus();
}

const notes = {
  office: {
    tag: "办公小记 · 3 分钟阅读",
    title: "给忙碌的一天，一点秩序感",
    content: `<p>工作中的很多事情并不复杂，只是容易同时涌过来。给它们安排一个位置，心里也会轻松一点。这是一份可以直接参考的日常整理方法。</p><h3>01 · 先写下来，再开始</h3><p>开始工作前，花五分钟列出今天的事项。先标记有明确截止时间的任务，再选出一到三件需要优先完成的事。临时收到的安排也放进同一张清单里。</p><h3>02 · 让文件名替你记忆</h3><p>试试「日期_事项_版本」的命名方式。例如「2026-09-11_会议纪要_v1」。一个项目放在同一个文件夹，已确认的版本再单独归档，减少反复查找。</p><h3>03 · 发出前，多看一眼</h3><ul><li>收件人、日期和时间是否正确？</li><li>需要的附件是否已经附上？</li><li>文件中的姓名、数字与版本是否一致？</li></ul><h3>04 · 留五分钟给明天</h3><p>结束工作前，勾掉已完成的事项，把未完成事项的下一步写具体。比起「处理文件」，「核对表格中本周的三条新增记录」更容易开始。</p><blockquote>有条不紊，不是把每一分钟填满，而是知道下一步要做什么。</blockquote>`,
  },
  music: {
    tag: "生活灵感 · 2 分钟阅读",
    title: "在音乐里，给自己一个休息",
    content: `<p>休息不一定要等到一个完整的周末。一首歌的时间，也可以成为忙碌日常中的一小块留白。</p><h3>把这一首歌听完</h3><p>选一首喜欢的歌，先把手边的消息放一放。让音乐成为此刻唯一要做的事，不急着切换，也不用同时完成其他任务。</p><h3>留一个轻松的听歌角落</h3><p>找个舒服的位置，把音量调到舒适的程度，给自己倒一杯水。可以听王菲，也可以换一首今天刚好想听的歌。喜欢就是足够好的理由。</p><h3>给当下留一个词</h3><p>听完以后，用一个词记下此刻的感觉：轻盈、平静、想念，或者什么也不写。音乐不需要交作业，这个小小的停顿也不用有什么成果。</p><blockquote>有时候，把生活的声音调小一点，就更容易听见自己。</blockquote>`,
  },
  journal: {
    tag: "记录日常 · 2 分钟阅读",
    title: "不用很特别，也值得被记住",
    content: `<p>日记并不一定要写很长，也不用等到发生一件大事才开始。一句随手记下的话，就能替今天留一扇小小的窗。</p><h3>从三行开始</h3><ul><li>今天看到的小美好：一束光、一片好看的云，或一只可爱的小兔子。</li><li>今天做成的一件事：再小也可以，它是你认真生活的痕迹。</li><li>想对自己说的一句话：温柔一点，不用急着评价。</li></ul><h3>不追求连续打卡</h3><p>有空就写，想起来就记录。忘了一天不需要补上，停了一阵也可以从今天重新开始。记录是为了保存生活里的感受，不是给自己增加一份任务。</p><h3>偶尔回头看看</h3><p>翻开以前留下的只言片语，会发现那些当时很普通的片刻也有自己的光。原来，小小的日子一直在认真地往前走。</p><blockquote>把一点美好留在纸上，平凡的一天就有了自己的书签。</blockquote>`,
  },
};

$$("[data-note]").forEach((button) =>
  button.addEventListener("click", () => {
    const note = notes[button.dataset.note];
    openDialog(
      `<span class="eyebrow">${note.tag}</span><h2 id="dialog-title" class="dialog-title">${note.title}</h2><span class="article-sample">示例笔记</span><article class="article-body">${note.content}</article><p class="article-footer">这是主页的示例内容，可以替换成轩颖自己的文章。</p>`,
    );
  }),
);
const toolHandlers = { focus: showFocus, todo: showTodos, text: showText };
$$("[data-tool]").forEach((button) =>
  button.addEventListener("click", () => toolHandlers[button.dataset.tool]()),
);

const menuButton = $(".menu-toggle");
const nav = $("#main-nav");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "打开导航");
  nav.classList.remove("open");
}
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  nav.classList.toggle("open", open);
});
$$("a", nav).forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});

const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
if (!motionPreference.matches && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-motion");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  $$(".reveal").forEach((element) => revealObserver.observe(element));
  motionPreference.addEventListener("change", (event) => {
    if (event.matches) document.documentElement.classList.remove("js-motion");
  });
}

const sections = ["home", "about", "tools", "notes"].map((id) =>
  document.getElementById(id),
);
let scrollScheduled = false;
function updateNav() {
  const position = window.scrollY + 180;
  let active = "home";
  sections.forEach((section) => {
    if (section.offsetTop <= position) active = section.id;
  });
  $$(".main-nav a").forEach((link) => {
    const selected = link.hash === `#${active}`;
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollScheduled = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollScheduled) {
      requestAnimationFrame(updateNav);
      scrollScheduled = true;
    }
  },
  { passive: true },
);
updateNav();
$("#year").textContent = new Date().getFullYear();
