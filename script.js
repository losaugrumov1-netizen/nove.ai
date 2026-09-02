const API_URL = "https://nove-ai.onrender.com";
const SUPABASE_URL = "https://mdlrlgyitqtuojuhmzyb.supabase.co";
const SUPABASE_KEY = "sb_publishable_N0oIXwELXrxxB3a1pj6tlw_lTGcX9j0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);

let authMode = "register";
let currentUser = JSON.parse(localStorage.getItem("novaUser") || "null");
let chatMessages = JSON.parse(localStorage.getItem("novaChats") || "[]");
let savedMessages = JSON.parse(localStorage.getItem("novaSaved") || "[]");
let filesData = JSON.parse(localStorage.getItem("novaFiles") || "[]");

const defaultSettings = {
  theme: "dark",
  accent: "blue",
  size: "normal",
  animations: true,
  sound: false,
  enterSend: true,
  autoSave: true,
  compact: true
};

let settings = {
  ...defaultSettings,
  ...JSON.parse(localStorage.getItem("novaSettings") || "{}")
};


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {
  applySettings();

  setupAuth();
  setupNavigation();
  setupChat();
  setupSidebar();
  setupProfile();
  setupSettings();
  setupFiles();
  setupVoice();
  setupHistorySearch();

  renderHistory();
  renderSaved();
  renderFiles();

  if (currentUser) {
    showApp();
  } else {
    showAuth();
  }
});


/* =========================
   AUTH
========================= */

function setupAuth() {
  $("authForm")?.addEventListener("submit", handleAuth);

  $("switchAuth")?.addEventListener("click", () => {
    authMode =
      authMode === "register"
        ? "login"
        : "register";

    updateAuthMode();
  });

  $("togglePassword")?.addEventListener("click", () => {
    togglePasswordField(
      "password",
      "togglePassword"
    );
  });

  $("toggleConfirmPassword")?.addEventListener("click", () => {
    togglePasswordField(
      "confirmPassword",
      "toggleConfirmPassword"
    );
  });

  $("toggleEditPassword")?.addEventListener("click", () => {
    togglePasswordField(
      "editPassword",
      "toggleEditPassword"
    );
  });

  $("password")?.addEventListener(
    "input",
    updateStrength
  );
}

function updateAuthMode() {
  const register =
    authMode === "register";

  if ($("authTitle")) {
    $("authTitle").textContent =
      register
        ? "Create account"
        : "Welcome back";
  }

  if ($("authSubtitle")) {
    $("authSubtitle").textContent =
      register
        ? "Create your NOVA account to continue."
        : "Login to continue to your NOVA workspace.";
  }

  if ($("authButton")) {
    $("authButton").textContent =
      register
        ? "CREATE ACCOUNT"
        : "LOGIN";
  }

  if ($("switchText")) {
    $("switchText").textContent =
      register
        ? "Already have an account?"
        : "Don't have an account?";
  }

  if ($("switchAuth")) {
    $("switchAuth").textContent =
      register
        ? "Login"
        : "Create account";
  }

  if ($("confirmBox")) {
    $("confirmBox").style.display =
      register ? "" : "none";
  }

  clearErrors();
}

function handleAuth(event) {
  event.preventDefault();

  clearErrors();

  const username =
    $("username")?.value.trim() || "";

  const email =
    $("email")?.value.trim().toLowerCase() || "";

  const password =
    $("password")?.value || "";

  const confirm =
    $("confirmPassword")?.value || "";

  let valid = true;

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    showError(
      "username",
      "Username must be 3–20 English letters, numbers or _."
    );

    valid = false;
  }

  if (!email.endsWith("@gmail.com")) {
    showError(
      "email",
      "Enter a valid Gmail address."
    );

    valid = false;
  }

  if (password.length < 6) {
    showError(
      "password",
      "Password must contain at least 6 characters."
    );

    valid = false;
  }

  if (
    authMode === "register" &&
    password !== confirm
  ) {
    showError(
      "confirm",
      "Passwords do not match."
    );

    valid = false;
  }

  if (!valid) return;

  const stored =
    JSON.parse(
      localStorage.getItem("novaAccount") || "null"
    );

  if (authMode === "register") {

    if (stored) {

      if (stored.username === username) {
        showError(
          "username",
          "This username is already registered."
        );

        return;
      }

      if (stored.email === email) {
        showError(
          "email",
          "This Gmail is already registered."
        );

        return;
      }
    }

    const account = {
      username,
      email,
      password,
      registered: new Date().toISOString(),
      avatar: ""
    };

    localStorage.setItem(
      "novaAccount",
      JSON.stringify(account)
    );

    currentUser = account;

    localStorage.setItem(
      "novaUser",
      JSON.stringify(account)
    );

    showToast("Account created");

    showApp();

  } else {

    if (!stored) {
      showError(
        "username",
        "No account found. Create an account first."
      );

      return;
    }

    if (
      stored.username !== username ||
      stored.email !== email
    ) {

      showError(
        "username",
        "Username or Gmail is incorrect."
      );

      showError(
        "email",
        "Username or Gmail is incorrect."
      );

      return;
    }

    if (stored.password !== password) {
      showError(
        "password",
        "Incorrect password."
      );

      return;
    }

    currentUser = stored;

    localStorage.setItem(
      "novaUser",
      JSON.stringify(currentUser)
    );

    showToast("Welcome back");

    showApp();
  }
}

function showError(type, message) {

  const map = {
    username: [
      "username",
      "usernameError"
    ],

    email: [
      "email",
      "emailError"
    ],

    password: [
      "password",
      "passwordError"
    ],

    confirm: [
      "confirmPassword",
      "confirmError"
    ]
  };

  const ids = map[type];

  if (!ids) return;

  const input = $(ids[0]);
  const error = $(ids[1]);

  input?.classList.add(
    "input-error"
  );

  if (error) {
    error.textContent = message;
  }
}

function clearErrors() {

  document
    .querySelectorAll("small")
    .forEach(el => {
      el.textContent = "";
    });

  document
    .querySelectorAll("input")
    .forEach(el => {
      el.classList.remove(
        "input-error"
      );
    });
}

function togglePasswordField(
  inputId,
  buttonId
) {

  const input = $(inputId);
  const button = $(buttonId);

  if (!input) return;

  if (input.type === "password") {

    input.type = "text";

    if (button) {
      button.textContent = "HIDE";
    }

  } else {

    input.type = "password";

    if (button) {
      button.textContent = "SHOW";
    }
  }
}

function updateStrength() {

  const password =
    $("password")?.value || "";

  const bar =
    $("strengthBar");

  if (!bar) return;

  let width = 0;

  if (password.length >= 6)
    width = 35;

  if (password.length >= 8)
    width = 60;

  if (/[A-Z]/.test(password))
    width += 15;

  if (/[0-9]/.test(password))
    width += 15;

  if (/[^A-Za-z0-9]/.test(password))
    width += 10;

  width = Math.min(
    width,
    100
  );

  bar.style.width =
    width + "%";
}

function showAuth() {

  $("authScreen")?.classList.remove(
    "hidden"
  );

  $("app")?.classList.add(
    "hidden"
  );
}

function showApp() {

  $("authScreen")?.classList.add(
    "hidden"
  );

  $("app")?.classList.remove(
    "hidden"
  );

  updateUserUI();
}


/* =========================
   NAVIGATION
========================= */

const pageNames = {

  home: [
    "Home",
    "Your personal AI workspace"
  ],

  chat: [
    "AI Chat",
    "Talk with NOVA"
  ],

  history: [
    "History",
    "Previous NOVA conversations"
  ],

  saved: [
    "Saved",
    "Responses you decided to keep"
  ],

  files: [
    "Files",
    "Your uploaded files"
  ],

  settings: [
    "Settings",
    "Configure your NOVA workspace"
  ],

  about: [
    "About",
    "Learn more about NOVA"
  ]
};

function setupNavigation() {

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          navigate(
            button.dataset.page
          );

          closeMobileSidebar();
        }
      );
    });

  document
    .querySelectorAll(".quick-card")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          navigate(
            button.dataset.quick
          );
        }
      );
    });

  $("startChatBtn")?.addEventListener(
    "click",
    () => navigate("chat")
  );

  $("newChatBtn")?.addEventListener(
    "click",
    () => {

      startNewChat();

      navigate("chat");
    }
  );
}

function navigate(page) {

  document
    .querySelectorAll(".page")
    .forEach(el => {
      el.classList.remove(
        "active"
      );
    });

  document
    .querySelectorAll(".nav-item")
    .forEach(el => {
      el.classList.remove(
        "active"
      );
    });

  const target =
    $("page-" + page);

  if (target) {
    target.classList.add(
      "active"
    );
  }

  const nav =
    document.querySelector(
      `.nav-item[data-page="${page}"]`
    );

  if (nav) {
    nav.classList.add(
      "active"
    );
  }

  if (pageNames[page]) {

    if ($("pageTitle")) {
      $("pageTitle").textContent =
        pageNames[page][0];
    }

    if ($("pageSubtitle")) {
      $("pageSubtitle").textContent =
        pageNames[page][1];
    }
  }

  if (page === "history")
    renderHistory();

  if (page === "saved")
    renderSaved();

  if (page === "files")
    renderFiles();
}


/* =========================
   CHAT
========================= */

function setupChat() {

  $("sendBtn")?.addEventListener(
    "click",
    sendMessage
  );

  $("chatInput")?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        settings.enterSend
      ) {

        event.preventDefault();

        sendMessage();
      }
    }
  );

  $("chatInput")?.addEventListener(
    "input",
    autoResize
  );

  $("clearChatBtn")?.addEventListener(
    "click",
    clearCurrentChat
  );

  $("hideMenuChatBtn")?.addEventListener(
    "click",
    hideMenu
  );

  document
    .querySelectorAll(".suggestion")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if ($("chatInput")) {

            $("chatInput").value =
              button.dataset.suggestion || "";

            autoResize();

            sendMessage();
          }
        }
      );
    });

  $("attachBtn")?.addEventListener(
    "click",
    () => {
      $("fileInput")?.click();
    }
  );

  $("fileInput")?.addEventListener(
    "change",
    handleFileUpload
  );
}

function autoResize() {

  const input =
    $("chatInput");

  if (!input) return;

  input.style.height =
    "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      120
    ) + "px";
}

async function sendMessage() {

  const input =
    $("chatInput");

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;

  input.value = "";

  autoResize();

  $("welcomeChat")?.remove();

  addMessage(
    text,
    "user"
  );

  chatMessages.push({
    role: "user",
    content: text,
    time: Date.now()
  });

  if (settings.autoSave)
    saveChats();

  setAIStatus(
    "NOVA is thinking...",
    true
  );

  const typing =
    addMessage(
      "Thinking...",
      "ai"
    );

  try {

    const response =
      await fetch(
        API_URL + "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            message: text,

            history:
              chatMessages
                .slice(-12)
                .map(m => ({
                  role: m.role,
                  content: m.content
                }))
          })
        }
      );

    if (!response.ok) {
      throw new Error(
        "Server error " +
        response.status
      );
    }

    const data =
      await response.json();

    typing?.remove();

    const answer =
      data.reply ||
      data.message ||
      data.response ||
      "NOVA didn't return a response.";

    addMessage(
      answer,
      "ai"
    );

    chatMessages.push({
      role: "assistant",
      content: answer,
      time: Date.now()
    });

    if (settings.autoSave)
      saveChats();

  } catch (error) {

    typing?.remove();

    addMessage(
      "Не удалось подключиться к NOVA AI.\n\nПроверь Render-сервер и API key.",
      "ai"
    );

    console.error(
      "CHAT ERROR:",
      error
    );
  }

  setAIStatus(
    "NOVA is ready",
    false
  );
}

function addMessage(
  text,
  type
) {

  const container =
    $("chatMessages");

  if (!container)
    return null;

  const message =
    document.createElement(
      "div"
    );

  message.className =
    "message " + type;

  const content =
    document.createElement(
      "div"
    );

  content.textContent =
    text;

  message.appendChild(
    content
  );

  if (type === "ai") {

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "message-actions";

    const save =
      document.createElement(
        "button"
      );

    save.textContent =
      "☆ Save";

    save.addEventListener(
      "click",
      () => {

        saveResponse(text);

        save.textContent =
          "✓ Saved";
      }
    );

    const copy =
      document.createElement(
        "button"
      );

    copy.textContent =
      "Copy";

    copy.addEventListener(
      "click",
      async () => {

        try {

          await navigator
            .clipboard
            .writeText(text);

          showToast(
            "Copied"
          );

        } catch {

          showToast(
            "Copy failed"
          );
        }
      }
    );

    actions.append(
      save,
      copy
    );

    message.appendChild(
      actions
    );
  }

  container.appendChild(
    message
  );

  container.scrollTo({
    top:
      container.scrollHeight,
    behavior:
      "smooth"
  });

  return message;
}

function setAIStatus(
  text,
  thinking
) {

  const status =
    $("aiStatus");

  if (!status) return;

  status.innerHTML =
    `<i></i>${text}`;

  const dot =
    status.querySelector(
      "i"
    );

  if (!dot) return;

  dot.style.background =
    thinking
      ? "#f5c542"
      : "var(--success)";
}

function clearCurrentChat() {

  chatMessages = [];

  saveChats();

  const container =
    $("chatMessages");

  if (!container)
    return;

  container.innerHTML = `
    <div class="welcome-chat" id="welcomeChat">
      <div class="nova-big">N</div>
      <h1>How can I help?</h1>
      <p>Ask NOVA anything, brainstorm an idea, write something or just chat.</p>
    </div>
  `;

  showToast(
    "Chat cleared"
  );
}

function startNewChat() {

  chatMessages = [];

  saveChats();

  const container =
    $("chatMessages");

  if (!container)
    return;

  container.innerHTML = `
    <div class="welcome-chat" id="welcomeChat">
      <div class="nova-big">N</div>
      <h1>New conversation</h1>
      <p>What would you like to talk about?</p>
    </div>
  `;
}


/* =========================
   HISTORY
========================= */

function saveChats() {

  localStorage.setItem(
    "novaChats",
    JSON.stringify(
      chatMessages
    )
  );
}

function renderHistory() {

  const list =
    $("historyList");

  if (!list)
    return;

  list.innerHTML = "";

  if (!chatMessages.length) {

    list.innerHTML =
      `<div class="list-empty">No conversations yet.</div>`;

    return;
  }

  const groups = [];

  for (
    let i = 0;
    i < chatMessages.length;
    i += 2
  ) {

    const first =
      chatMessages[i];

    if (first)
      groups.push(first);
  }

  groups.reverse().forEach(
    item => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "list-item";

      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        item.content.slice(
          0,
          80
        ) ||
        "Conversation";

      const p =
        document.createElement(
          "p"
        );

      p.textContent =
        new Date(
          item.time
        ).toLocaleString();

      row.append(
        title,
        p
      );

      row.addEventListener(
        "click",
        () => {

          navigate("chat");

          showToast(
            "Conversation selected"
          );
        }
      );

      list.appendChild(
        row
      );
    }
  );
}

function setupHistorySearch() {

  $("historySearch")?.addEventListener(
    "input",
    function () {

      const query =
        this.value
          .toLowerCase();

      document
        .querySelectorAll(
          "#historyList .list-item"
        )
        .forEach(item => {

          item.style.display =
            item.textContent
              .toLowerCase()
              .includes(query)
              ? ""
              : "none";
        });
    }
  );
}


/* =========================
   SAVED
========================= */

function saveResponse(text) {

  if (
    savedMessages.some(
      item =>
        typeof item === "string"
          ? item === text
          : item.text === text
    )
  ) {

    showToast(
      "Already saved"
    );

    return;
  }

  savedMessages.push({
    text,
    time: Date.now()
  });

  localStorage.setItem(
    "novaSaved",
    JSON.stringify(
      savedMessages
    )
  );

  renderSaved();

  showToast(
    "Response saved"
  );
}

function renderSaved() {

  const list =
    $("savedList");

  if (!list)
    return;

  list.innerHTML = "";

  if (!savedMessages.length) {

    list.innerHTML =
      `<div class="list-empty">No saved responses.</div>`;

    return;
  }

  [...savedMessages]
    .reverse()
    .forEach(item => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "list-item";

      const text =
        document.createElement(
          "p"
        );

      text.textContent =
        typeof item === "string"
          ? item
          : item.text;

      const remove =
        document.createElement(
          "button"
        );

      remove.className =
        "secondary-btn";

      remove.textContent =
        "Remove";

      remove.addEventListener(
        "click",
        () => {

          savedMessages =
            savedMessages.filter(
              x => x !== item
            );

          localStorage.setItem(
            "novaSaved",
            JSON.stringify(
              savedMessages
            )
          );

          renderSaved();
        }
      );

      row.append(
        text,
        remove
      );

      list.appendChild(
        row
      );
    });
}


/* =========================
   SIDEBAR
========================= */

function setupSidebar() {

  $("openSidebar")?.addEventListener(
    "click",
    openMobileSidebar
  );

  $("closeSidebar")?.addEventListener(
    "click",
    closeMobileSidebar
  );

  $("sidebarOverlay")?.addEventListener(
    "click",
    closeMobileSidebar
  );

  $("showSidebarBtn")?.addEventListener(
    "click",
    showMenu
  );
}

function openMobileSidebar() {

  $("sidebar")?.classList.add(
    "open"
  );

  $("sidebarOverlay")?.classList.add(
    "open"
  );
}

function closeMobileSidebar() {

  $("sidebar")?.classList.remove(
    "open"
  );

  $("sidebarOverlay")?.classList.remove(
    "open"
  );
}

function hideMenu() {

  document.body.classList.add(
    "menu-hidden"
  );

  showToast(
    "Menu hidden"
  );
}

function showMenu() {

  document.body.classList.remove(
    "menu-hidden"
  );
}


/* =========================
   PROFILE
========================= */

function setupProfile() {

  $("accountBtn")?.addEventListener(
    "click",
    openProfile
  );

  $("topAvatar")?.addEventListener(
    "click",
    openProfile
  );

  $("editProfileBtn")?.addEventListener(
    "click",
    openEditProfile
  );

  $("profileSettingsBtn")?.addEventListener(
    "click",
    () => {

      closeModal(
        "profileModal"
      );

      navigate(
        "settings"
      );
    }
  );

  $("logoutBtn")?.addEventListener(
    "click",
    logout
  );

  $("saveProfileBtn")?.addEventListener(
    "click",
    saveProfile
  );

  $("showProfilePassword")?.addEventListener(
    "click",
    () => {

      const input =
        $("profilePassword");

      const button =
        $("showProfilePassword");

      if (!input)
        return;

      if (
        input.type ===
        "password"
      ) {

        input.type =
          "text";

        button.textContent =
          "HIDE";

      } else {

        input.type =
          "password";

        button.textContent =
          "SHOW";
      }
    }
  );

  $("changeAvatarBtn")?.addEventListener(
    "click",
    () => {
      $("avatarInput")?.click();
    }
  );

  $("avatarInput")?.addEventListener(
    "change",
    changeAvatar
  );

  $("removeAvatarBtn")?.addEventListener(
    "click",
    removeAvatar
  );

  document
    .querySelectorAll("[data-close]")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          closeModal(
            btn.dataset.close
          );
        }
      );
    });
}

function updateUserUI() {

  if (!currentUser)
    return;

  const username =
    currentUser.username ||
    "User";

  const avatar =
    currentUser.avatar ||
    "";

  if ($("sidebarUsername"))
    $("sidebarUsername").textContent =
      username;

  if ($("profileName"))
    $("profileName").textContent =
      username;

  if ($("profileUsername"))
    $("profileUsername").textContent =
      username;

  if ($("profileEmail"))
    $("profileEmail").textContent =
      currentUser.email ||
      "—";

  if ($("profileDate"))
    $("profileDate").textContent =
      currentUser.registered
        ? new Date(
            currentUser.registered
          ).toLocaleDateString()
        : "—";

  if ($("profilePassword")) {
    $("profilePassword").value =
      currentUser.password ||
      "";
  }

  setAvatar(
    $("sidebarAvatar"),
    avatar,
    username
  );

  setAvatar(
    $("topAvatar"),
    avatar,
    username
  );

  setAvatar(
    $("profileAvatar"),
    avatar,
    username
  );

  setAvatar(
    $("editAvatar"),
    avatar,
    username
  );
}

function setAvatar(
  element,
  image,
  username
) {

  if (!element)
    return;

  element.innerHTML =
    "";

  if (image) {

    const img =
      document.createElement(
        "img"
      );

    img.src =
      image;

    element.appendChild(
      img
    );

  } else {

    element.textContent =
      (
        username ||
        "N"
      )
        .charAt(0)
        .toUpperCase();
  }
}

function openProfile() {

  updateUserUI();

  $("profileModal")?.classList.remove(
    "hidden"
  );
}

function openEditProfile() {

  closeModal(
    "profileModal"
  );

  if ($("editUsername")) {
    $("editUsername").value =
      currentUser?.username ||
      "";
  }

  if ($("editPassword")) {
    $("editPassword").value =
      "";
  }

  if ($("editError")) {
    $("editError").textContent =
      "";
  }

  if ($("editSuccess")) {
    $("editSuccess").textContent =
      "";
  }

  $("editModal")?.classList.remove(
    "hidden"
  );
}

function saveProfile() {

  if (!currentUser)
    return;

  const username =
    $("editUsername")
      ?.value
      .trim() || "";

  const newPassword =
    $("editPassword")
      ?.value || "";

  if (
    !/^[A-Za-z0-9_]{3,20}$/.test(
      username
    )
  ) {

    if ($("editError")) {
      $("editError").textContent =
        "Username must be 3–20 English letters, numbers or _.";
    }

    return;
  }

  if (
    newPassword &&
    newPassword.length < 6
  ) {

    if ($("editError")) {
      $("editError").textContent =
        "Password must contain at least 6 characters.";
    }

    return;
  }

  currentUser.username =
    username;

  if (newPassword) {
    currentUser.password =
      newPassword;
  }

  localStorage.setItem(
    "novaUser",
    JSON.stringify(
      currentUser
    )
  );

  localStorage.setItem(
    "novaAccount",
    JSON.stringify(
      currentUser
    )
  );

  if ($("editSuccess")) {
    $("editSuccess").textContent =
      "Profile updated.";
  }

  updateUserUI();

  showToast(
    "Profile updated"
  );

  setTimeout(
    () => {
      closeModal(
        "editModal"
      );
    },
    700
  );
}

function changeAvatar(event) {

  const file =
    event.target.files?.[0];

  if (!file)
    return;

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    showToast(
      "Please choose an image"
    );

    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {

    currentUser.avatar =
      reader.result;

    localStorage.setItem(
      "novaUser",
      JSON.stringify(
        currentUser
      )
    );

    localStorage.setItem(
      "novaAccount",
      JSON.stringify(
        currentUser
      )
    );

    updateUserUI();

    showToast(
      "Avatar changed"
    );
  };

  reader.readAsDataURL(
    file
  );
}

function removeAvatar() {

  if (!currentUser)
    return;

  currentUser.avatar =
    "";

  localStorage.setItem(
    "novaUser",
    JSON.stringify(
      currentUser
    )
  );

  localStorage.setItem(
    "novaAccount",
    JSON.stringify(
      currentUser
    )
  );

  updateUserUI();

  showToast(
    "Avatar removed"
  );
}

function logout() {

  localStorage.removeItem(
    "novaUser"
  );

  currentUser = null;

  closeModal(
    "profileModal"
  );

  showAuth();

  showToast(
    "Logged out"
  );
}

function closeModal(id) {

  $(id)?.classList.add(
    "hidden"
  );
}


/* =========================
   SETTINGS
========================= */

function setupSettings() {

  $("themeSelect")?.addEventListener(
    "change",
    e => {

      settings.theme =
        e.target.value;

      saveSettings();
      applySettings();
    }
  );

  $("accentSelect")?.addEventListener(
    "change",
    e => {

      settings.accent =
        e.target.value;

      saveSettings();
      applySettings();
    }
  );

  $("sizeSelect")?.addEventListener(
    "change",
    e => {

      settings.size =
        e.target.value;

      saveSettings();
      applySettings();
    }
  );

  $("animationsToggle")?.addEventListener(
    "change",
    e => {

      settings.animations =
        e.target.checked;

      saveSettings();
      applySettings();
    }
  );

  $("soundToggle")?.addEventListener(
    "change",
    e => {

      settings.sound =
        e.target.checked;

      saveSettings();
    }
  );

  $("enterSendToggle")?.addEventListener(
    "change",
    e => {

      settings.enterSend =
        e.target.checked;

      saveSettings();
    }
  );

  $("autoSaveToggle")?.addEventListener(
    "change",
    e => {

      settings.autoSave =
        e.target.checked;

      saveSettings();
    }
  );

  $("compactChatToggle")?.addEventListener(
    "change",
    e => {

      settings.compact =
        e.target.checked;

      saveSettings();
      applySettings();
    }
  );

  $("clearHistoryBtn")?.addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Clear all chat history?"
        )
      )
        return;

      chatMessages = [];

      saveChats();
      renderHistory();

      showToast(
        "History cleared"
      );
    }
  );

  $("clearDataBtn")?.addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Delete all NOVA data from this browser?"
        )
      )
        return;

      localStorage.clear();

      location.reload();
    }
  );
}

function saveSettings() {

  localStorage.setItem(
    "novaSettings",
    JSON.stringify(
      settings
    )
  );
}

function applySettings() {

  document.body.classList.toggle(
    "light",
    settings.theme === "light"
  );

  document.body.classList.toggle(
    "no-animations",
    !settings.animations
  );

  document.body.classList.remove(
    "size-small",
    "size-large"
  );

  if (settings.size === "small") {
    document.body.classList.add(
      "size-small"
    );
  }

  if (settings.size === "large") {
    document.body.classList.add(
      "size-large"
    );
  }

  const colors = {
    blue: "#6d7cff",
    purple: "#9b6dff",
    cyan: "#36d9ff",
    green: "#55d98b",
    pink: "#ff6da8"
  };

  document.documentElement.style.setProperty(
    "--accent",
    colors[settings.accent] ||
      colors.blue
  );

  if ($("themeSelect"))
    $("themeSelect").value =
      settings.theme;

  if ($("accentSelect"))
    $("accentSelect").value =
      settings.accent;

  if ($("sizeSelect"))
    $("sizeSelect").value =
      settings.size;

  if ($("animationsToggle"))
    $("animationsToggle").checked =
      settings.animations;

  if ($("soundToggle"))
    $("soundToggle").checked =
      settings.sound;

  if ($("enterSendToggle"))
    $("enterSendToggle").checked =
      settings.enterSend;

  if ($("autoSaveToggle"))
    $("autoSaveToggle").checked =
      settings.autoSave;

  if ($("compactChatToggle"))
    $("compactChatToggle").checked =
      settings.compact;
}


/* =========================
   FILES
========================= */

function setupFiles() {

  $("uploadFileBtn")?.addEventListener(
    "click",
    () => {
      $("fileInput")?.click();
    }
  );
}

function handleFileUpload(event) {

  const files =
    [...event.target.files];

  files.forEach(file => {

    filesData.push({
      name: file.name,
      size: file.size,
      type: file.type,
      date: Date.now()
    });
  });

  localStorage.setItem(
    "novaFiles",
    JSON.stringify(
      filesData
    )
  );

  renderFiles();

  showToast(
    files.length === 1
      ? "File uploaded"
      : `${files.length} files uploaded`
  );

  event.target.value =
    "";
}

function renderFiles() {

  const list =
    $("filesList");

  if (!list)
    return;

  list.innerHTML =
    "";

  if (!filesData.length) {

    list.innerHTML =
      `<div class="list-empty">No files uploaded.</div>`;

    return;
  }

  [...filesData]
    .reverse()
    .forEach(file => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "list-item";

      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        file.name;

      const p =
        document.createElement(
          "p"
        );

      p.textContent =
        `${formatBytes(file.size)} • ${new Date(file.date).toLocaleDateString()}`;

      const remove =
        document.createElement(
          "button"
        );

      remove.className =
        "danger-btn";

      remove.textContent =
        "Remove";

      remove.addEventListener(
        "click",
        () => {

          filesData =
            filesData.filter(
              x => x !== file
            );

          localStorage.setItem(
            "novaFiles",
            JSON.stringify(
              filesData
            )
          );

          renderFiles();
        }
      );

      row.append(
        title,
        p,
        remove
      );

      list.appendChild(
        row
      );
    });
}

function formatBytes(bytes) {

  if (!bytes)
    return "0 B";

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  return (
    (
      bytes /
      Math.pow(
        1024,
        index
      )
    ).toFixed(
      index === 0
        ? 0
        : 1
    ) +
    " " +
    units[index]
  );
}


/* =========================
   VOICE INPUT
========================= */

let recognition = null;
let isListening = false;
let voiceStarting = false;

function getSpeechRecognition() {

  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  );
}

function setupVoice() {

  const button =
    $("voiceBtn");

  if (!button) {
    console.warn(
      "VOICE: voiceBtn not found"
    );

    return;
  }

  /*
    ВАЖНО:
    Убираем старые обработчики через замену
    кнопки на её клон.
    Это предотвращает двойной запуск.
  */

  const cleanButton =
    button.cloneNode(true);

  button.replaceWith(
    cleanButton
  );

  cleanButton.addEventListener(
    "click",
    startVoiceInput
  );

  console.log(
    "VOICE: READY"
  );
}

function startVoiceInput() {

  const SpeechRecognition =
    getSpeechRecognition();

  if (!SpeechRecognition) {

    showToast(
      "❌ Speech Recognition не поддерживается этим браузером"
    );

    console.error(
      "VOICE: SpeechRecognition unavailable"
    );

    return;
  }

  if (voiceStarting) {
    return;
  }

  if (isListening) {

    try {
      recognition?.stop();
    } catch {}

    return;
  }

  voiceStarting = true;

  try {

    recognition =
      new SpeechRecognition();

    recognition.lang =
      "ru-RU";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;

    recognition.maxAlternatives =
      1;

    recognition.onstart =
      () => {

        voiceStarting =
          false;

        isListening =
          true;

        $("voiceBtn")?.classList.add(
          "listening"
        );

        setAIStatus(
          "Listening...",
          false
        );

        showToast(
          "🎙 Говори..."
        );

        console.log(
          "VOICE: START"
        );
      };

    recognition.onresult =
      event => {

        const result =
          event.results?.[0]?.[0];

        const text =
          result?.transcript || "";

        console.log(
          "VOICE RESULT:",
          text
        );

        if (!text.trim()) {

          showToast(
            "😭 Я ничего не услышал"
          );

          return;
        }

        const input =
          $("chatInput");

        if (input) {

          input.value =
            input.value.trim()
              ? input.value +
                " " +
                text
              : text;

          autoResize();

          input.focus();
        }

        showToast(
          "✅ Распознано"
        );
      };

    recognition.onerror =
      event => {

        console.error(
          "VOICE ERROR:",
          event.error
        );

        voiceStarting =
          false;

        isListening =
          false;

        $("voiceBtn")?.classList.remove(
          "listening"
        );

        setAIStatus(
          "NOVA is ready",
          false
        );

        /*
          iPad/Safari иногда отправляет
          aborted даже при нормальной работе.
          Поэтому не показываем это пользователю
          как ошибку.
        */

        if (
          event.error ===
          "aborted"
        ) {

          console.log(
            "VOICE: aborted ignored"
          );

          return;
        }

        if (
          event.error ===
          "not-allowed"
        ) {

          showToast(
            "❌ Safari не дал доступ к микрофону"
          );

          return;
        }

        if (
          event.error ===
          "audio-capture"
        ) {

          showToast(
            "❌ Не удалось получить микрофон"
          );

          return;
        }

        if (
          event.error ===
          "no-speech"
        ) {

          showToast(
            "😭 Речь не обнаружена"
          );

          return;
        }

        if (
          event.error ===
          "network"
        ) {

          showToast(
            "❌ Ошибка сети распознавания"
          );

          return;
        }

        showToast(
          "❌ Voice error: " +
          event.error
        );
      };

    recognition.onend =
      () => {

        console.log(
          "VOICE: END"
        );

        voiceStarting =
          false;

        isListening =
          false;

        $("voiceBtn")?.classList.remove(
          "listening"
        );

        setAIStatus(
          "NOVA is ready",
          false
        );

        recognition =
          null;
      };

    console.log(
      "VOICE: starting..."
    );

    recognition.start();

  } catch (error) {

    console.error(
      "VOICE START ERROR:",
      error
    );

    voiceStarting =
      false;

    isListening =
      false;

    $("voiceBtn")?.classList.remove(
      "listening"
    );

    recognition =
      null;

    showToast(
      "❌ Не удалось запустить голосовой ввод"
    );
  }
}


/* =========================
   TOAST
========================= */

function showToast(text) {

  const container =
    $("toastContainer");

  if (!container)
    return;

  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    "toast";

  toast.textContent =
    text;

  container.appendChild(
    toast
  );

  setTimeout(
    () => {
      toast.remove();
    },
    2200
  );
}
