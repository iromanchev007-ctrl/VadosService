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

/* ===== Каталог марок и моделей мототехники ===== */
const BIKE_DATA = {
  "Honda": ["CB400", "CBR600RR", "CBR1000RR", "CRF250L", "Africa Twin", "Rebel 500", "X-ADV", "Forza 350"],
  "Yamaha": ["YZF-R1", "YZF-R6", "MT-07", "MT-09", "Tenere 700", "XSR700", "FZ6", "NMAX 155"],
  "Suzuki": ["GSX-R600", "GSX-R750", "GSX-R1000", "SV650", "V-Strom 650", "Boulevard M109R", "Burgman 400"],
  "Kawasaki": ["Ninja 400", "Ninja ZX-6R", "Ninja ZX-10R", "Z650", "Z900", "Versys 650", "Vulcan S"],
  "BMW": ["S1000RR", "R1250GS", "F850GS", "F900R", "R nineT", "G310R", "C400X"],
  "Ducati": ["Panigale V2", "Panigale V4", "Monster", "Multistrada", "Scrambler", "Diavel"],
  "KTM": ["Duke 390", "Duke 790", "Duke 890", "RC 390", "1290 Super Adventure", "390 Adventure"],
  "Harley-Davidson": ["Sportster", "Iron 883", "Street Bob", "Fat Boy", "Road King", "Forty-Eight"],
  "Triumph": ["Street Triple", "Speed Triple", "Bonneville T120", "Tiger 900", "Trident 660", "Rocket 3"],
  "Aprilia": ["RS 660", "RSV4", "Tuono 660", "Tuono V4", "Shiver 900"],
  "CFMoto": ["250NK", "400NK", "650NK", "650MT", "700CL-X", "800MT", "450SR"],
  "Voge": ["300R", "300AC", "500R", "500DS", "525DSX", "650DS"],
  "Benelli": ["TNT 302", "Leoncino 500", "TRK 502", "752S", "Imperiale 400"],
  "Royal Enfield": ["Classic 350", "Meteor 350", "Himalayan", "Continental GT 650", "Interceptor 650"],
  "Bajaj": ["Pulsar 150", "Pulsar 200NS", "Pulsar RS200", "Dominar 400", "Avenger"],
  "Irbis": ["TTR 250", "TTR 110", "GR 250", "Z1", "VR-1"],
  "Racer": ["Tiger", "Panther", "Ranger", "Skyway", "Nitro"],
  "Stels": ["Flex 250", "600 Benelli", "Trigger 250", "ATV (квадроцикл)"],
  "Минск (M1NSK)": ["C4 250", "D4 125", "X 250", "TRX 300"]
};

/* ===== DOM ===== */
const $ = (s, root = document) => root.querySelector(s);

document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();
  initMenu();
  initReveal();
  initBikeSelectors();
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
function initBikeSelectors() {
  const brand = $("#brand");
  const brandOther = $("#brandOther");
  const model = $("#model");
  const modelOther = $("#modelOther");

  // Заполняем марки (перед опцией "Другая")
  const otherOption = brand.querySelector('option[value="__other__"]');
  Object.keys(BIKE_DATA).forEach((name) => {
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

    if (val && val !== "__other__" && BIKE_DATA[val]) {
      model.disabled = false;
      model.appendChild(makeOption("", "Выберите модель"));
      BIKE_DATA[val].forEach((m) => model.appendChild(makeOption(m, m)));
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
    "🏍️ <b>Новая заявка — Вадос Сервис</b>\n\n" +
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
