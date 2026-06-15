/* =====================================================================
   ВАДОС СЕРВИС — логика сайта
   =====================================================================

   👉 НАСТРОЙКА ОТПРАВКИ В TELEGRAM (вставьте свои значения ниже):

   1. BOT_TOKEN — токен бота от @BotFather (выглядит как 123456789:AAH...).
   2. CHAT_ID   — ID чата/менеджера, куда придёт заявка.
                  Узнать можно так: напишите боту любое сообщение и
                  откройте https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates
                  — нужное число лежит в поле "chat":{"id": ... }.
                  Для группы добавьте бота в группу (ID будет с минусом).

   ⚠️  ВАЖНО про безопасность:
       При таком способе токен виден в коде страницы (любой статический сайт).
       Это рабочий вариант для простого лендинга. Если хотите спрятать токен —
       используйте serverless-функцию (см. README.md, раздел «Безопасный вариант»).
   ===================================================================== */

const BOT_TOKEN = "ВСТАВЬТЕ_ТОКЕН_БОТА";   // ← сюда токен
const CHAT_ID   = "ВСТАВЬТЕ_CHAT_ID";       // ← сюда chat id

/* ===== Каталог марок и моделей автомобилей ===== */
const CAR_DATA = {
  "Lada (ВАЗ)": ["Granta", "Vesta", "Largus", "Niva Legend", "Niva Travel", "XRAY", "Priora", "Kalina", "2107", "2114"],
  "Toyota": ["Camry", "Corolla", "RAV4", "Land Cruiser", "Land Cruiser Prado", "Highlander", "Avensis", "Yaris"],
  "Kia": ["Rio", "Sportage", "Sorento", "Cerato", "Optima", "Ceed", "Soul", "Picanto"],
  "Hyundai": ["Solaris", "Creta", "Tucson", "Santa Fe", "Elantra", "Sonata", "i30", "Accent"],
  "Volkswagen": ["Polo", "Golf", "Passat", "Tiguan", "Touareg", "Jetta", "Caddy", "Transporter"],
  "Renault": ["Logan", "Sandero", "Duster", "Kaptur", "Arkana", "Megane", "Fluence", "Symbol"],
  "Nissan": ["Almera", "Qashqai", "X-Trail", "Juke", "Note", "Terrano", "Murano", "Teana"],
  "Skoda": ["Octavia", "Rapid", "Fabia", "Kodiaq", "Karoq", "Superb", "Yeti"],
  "Ford": ["Focus", "Mondeo", "Kuga", "Fiesta", "EcoSport", "Explorer", "Transit"],
  "Chevrolet": ["Aveo", "Cruze", "Lacetti", "Niva", "Captiva", "Cobalt", "Spark"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "Sprinter", "Vito"],
  "BMW": ["1 серия", "3 серия", "5 серия", "7 серия", "X1", "X3", "X5", "X6"],
  "Audi": ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7"],
  "Mazda": ["3", "6", "CX-5", "CX-30", "CX-7", "CX-9"],
  "Mitsubishi": ["Lancer", "Outlander", "ASX", "Pajero", "Pajero Sport", "L200"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Fit", "HR-V"],
  "Opel": ["Astra", "Corsa", "Insignia", "Zafira", "Mokka", "Vectra"],
  "Geely": ["Coolray", "Atlas", "Atlas Pro", "Tugella", "Monjaro", "Emgrand"],
  "Chery": ["Tiggo 4", "Tiggo 7 Pro", "Tiggo 8 Pro", "Arrizo 8", "Tiggo 4 Pro"],
  "Haval": ["Jolion", "F7", "F7x", "Dargo", "H9", "M6"],
  "UAZ (УАЗ)": ["Patriot", "Hunter", "Pickup", "Profi", "Буханка (2206)"],
  "GAZ (ГАЗ)": ["Газель Next", "Газель Бизнес", "Соболь", "Волга"]
};

/* ===== DOM ===== */
const $ = (s, root = document) => root.querySelector(s);

document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();
  initMenu();
  initReveal();
  initCarSelectors();
  initPhoneMask();
  initForm();
});

/* ===== Мобильное меню ===== */
function initMenu() {
  const burger = $("#burger");
  const nav = $(".nav");
  if (!burger || !nav) return;
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      burger.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    })
  );
}

/* ===== Анимация появления блоков при прокрутке ===== */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

/* ===== Выпадающие списки марки и модели ===== */
function initCarSelectors() {
  const brand = $("#brand");
  const brandOther = $("#brandOther");
  const model = $("#model");
  const modelOther = $("#modelOther");

  // Заполняем марки (перед опцией "Другая")
  const otherOption = brand.querySelector('option[value="__other__"]');
  Object.keys(CAR_DATA).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    brand.insertBefore(opt, otherOption);
  });

  brand.addEventListener("change", () => {
    const val = brand.value;

    // Ручной ввод марки
    if (val === "__other__") {
      brandOther.classList.add("show");
    } else {
      brandOther.classList.remove("show");
      brandOther.value = "";
    }

    // Сброс моделей
    model.innerHTML = "";
    modelOther.classList.remove("show");
    modelOther.value = "";

    if (val && val !== "__other__" && CAR_DATA[val]) {
      model.disabled = false;
      model.appendChild(makeOption("", "Выберите модель"));
      CAR_DATA[val].forEach((m) => model.appendChild(makeOption(m, m)));
      model.appendChild(makeOption("__other__", "Другая (ввести вручную)"));
    } else if (val === "__other__") {
      // Марка вручную → модель тоже вручную
      model.disabled = false;
      model.appendChild(makeOption("__other__", "Введите модель вручную"));
      model.value = "__other__";
      modelOther.classList.add("show");
    } else {
      model.disabled = true;
      model.appendChild(makeOption("", "Сначала выберите марку"));
    }
  });

  model.addEventListener("change", () => {
    if (model.value === "__other__") {
      modelOther.classList.add("show");
    } else {
      modelOther.classList.remove("show");
      modelOther.value = "";
    }
  });
}

function makeOption(value, text) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  return o;
}

/* ===== Простая маска телефона ===== */
function initPhoneMask() {
  const phone = $("#phone");
  if (!phone) return;
  phone.addEventListener("input", () => {
    let d = phone.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    let out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 4) out += ") " + d.slice(4, 7);
    if (d.length >= 7) out += "-" + d.slice(7, 9);
    if (d.length >= 9) out += "-" + d.slice(9, 11);
    phone.value = out;
  });
}

/* ===== Отправка формы ===== */
function initForm() {
  const form = $("#bookingForm");
  const success = $("#formSuccess");
  const errorBox = $("#formError");
  const btn = $("#submitBtn");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    success.hidden = true;
    errorBox.hidden = true;

    // Валидация обязательных полей
    let valid = true;
    [["#name"], ["#phone"]].forEach(([sel]) => {
      const input = $(sel);
      const ok = input.value.trim().length > 1;
      input.closest(".field").classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      showError(errorBox, "Пожалуйста, заполните имя и телефон.");
      return;
    }

    const data = collectData();
    const message = buildMessage(data);

    btn.disabled = true;
    btn.textContent = "Отправляем...";

    try {
      await sendToTelegram(message);
      form.reset();
      resetExtraInputs();
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      showError(errorBox, "Не удалось отправить заявку. Позвоните нам: +7 (927) 129-54-03");
    } finally {
      btn.disabled = false;
      btn.textContent = "Отправить заявку";
    }
  });
}

function collectData() {
  const brandSel = $("#brand").value;
  const brand = brandSel === "__other__" ? $("#brandOther").value.trim() : brandSel;
  const modelSel = $("#model").value;
  const model = modelSel === "__other__" ? $("#modelOther").value.trim() : modelSel;
  return {
    name: $("#name").value.trim(),
    phone: $("#phone").value.trim(),
    email: $("#email").value.trim(),
    brand: brand || "—",
    model: model || "—",
    service: $("#service").value || "—",
    comment: $("#comment").value.trim() || "—",
  };
}

function buildMessage(d) {
  return (
    "🚗 <b>Новая заявка — Вадос Сервис</b>\n\n" +
    `👤 Имя: <b>${esc(d.name)}</b>\n` +
    `📞 Телефон: <b>${esc(d.phone)}</b>\n` +
    `✉️ Email: ${esc(d.email || "—")}\n` +
    `🏷️ Марка: ${esc(d.brand)}\n` +
    `🔧 Модель: ${esc(d.model)}\n` +
    `🛠️ Услуга: ${esc(d.service)}\n` +
    `💬 Комментарий: ${esc(d.comment)}\n\n` +
    `🕒 ${new Date().toLocaleString("ru-RU")}`
  );
}

async function sendToTelegram(text) {
  // Если токен не настроен — не падаем молча, а сообщаем в консоль
  if (BOT_TOKEN.includes("ВСТАВЬТЕ") || CHAT_ID.includes("ВСТАВЬТЕ")) {
    throw new Error("Telegram не настроен: укажите BOT_TOKEN и CHAT_ID в script.js");
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
  });
  if (!res.ok) throw new Error("Telegram API error: " + res.status);
  return res.json();
}

function resetExtraInputs() {
  $("#brandOther").classList.remove("show");
  $("#modelOther").classList.remove("show");
  $("#model").disabled = true;
  $("#model").innerHTML = '<option value="">Сначала выберите марку</option>';
  document.querySelectorAll(".field.invalid").forEach(f => f.classList.remove("invalid"));
}

function showError(box, msg) {
  box.textContent = msg;
  box.hidden = false;
}

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
