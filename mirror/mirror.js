/**
 * Tivaro - Car Vanity Mirror Interactive Engine & Order Manager
 * Google Sheets Integration & Dynamic 58 Wilayas Selector
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- رابط جوجل شيت Webhook ---
  const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwWh1yCjF6mC-wMyYeH3nbDajCYgE3MbJlr_uwjZT_xsgDQBTIW5OeNXerSMBFbgTRbpw/exec';

  // --- باقات وعروض مرآة السيارة المضيئة ---
  const packages = {
    1: {
      id: 1,
      name: 'مرآة واحدة (1)',
      qty: 1,
      price: 2900,
      originalPrice: 3900,
      badge: 'الطلب الأساسي',
      shippingText: 'توصيل سريع'
    },
    2: {
      id: 2,
      name: 'مرآتان (2 قطع)',
      qty: 2,
      price: 4900,
      originalPrice: 5800,
      badge: 'الأكثر طلباً 🔥',
      shippingText: 'وفر 900 دج'
    }
  };

  let selectedPackageId = 2; // Default to 2 pieces
  let deliveryType = 'home'; // 'home' or 'office'

  // DOM Elements
  const header = document.querySelector('header');
  const packageCards = document.querySelectorAll('.package-option-card');
  const orderForm = document.getElementById('mirrorOrderForm');
  const summaryPackageName = document.getElementById('summaryPackageName');
  const summaryQty = document.getElementById('summaryQty');
  const summaryTotal = document.getElementById('summaryTotal');
  const countdownTimer = document.getElementById('countdownTimer');
  
  // Delivery Type & Selects
  const tabHome = document.getElementById('tabHome');
  const tabOffice = document.getElementById('tabOffice');
  const wilayaSelect = document.getElementById('wilayaSelect');
  const communeSelect = document.getElementById('communeSelect');
  const officeSelect = document.getElementById('officeSelect');
  const communeGroup = document.getElementById('communeGroup');
  const addressGroup = document.getElementById('addressGroup');
  const officeGroup = document.getElementById('officeGroup');
  const addressInput = document.getElementById('addressInput');
  const phoneInput = document.getElementById('phoneInput');

  // Modal Elements
  const successModal = document.getElementById('orderSuccessModal');
  const closeModalBtn = document.getElementById('closeSuccessModal');
  const receiptOrderNum = document.getElementById('receiptOrderNum');
  const receiptPackage = document.getElementById('receiptPackage');
  const receiptAddress = document.getElementById('receiptAddress');
  const receiptTotal = document.getElementById('receiptTotal');

  // Header scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Countdown timer
  function updateCountdown() {
    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const diff = end - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (countdownTimer) {
      countdownTimer.textContent = `${hours} ساعة و ${minutes} دقيقة`;
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000 * 60);

  // Phone input filter (numbers only)
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }

  // Package Selection Logic
  function updatePackageUI(pkgId) {
    selectedPackageId = pkgId;
    const pkg = packages[pkgId];

    packageCards.forEach(card => {
      const id = parseInt(card.getAttribute('data-package'));
      if (id === pkgId) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    if (summaryPackageName) summaryPackageName.textContent = pkg.name;
    if (summaryQty) summaryQty.textContent = `${pkg.qty} قطعة`;
    if (summaryTotal) summaryTotal.textContent = `${pkg.price} دج`;
  }

  packageCards.forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.getAttribute('data-package'));
      updatePackageUI(id);
    });
  });

  // Lighting Mode Demo Buttons
  const modeBtns = document.querySelectorAll('.mode-btn');
  const modePreview = document.getElementById('modePreviewBox');
  const modeStatusText = document.getElementById('modeStatusText');

  const modeDescriptions = {
    'white': 'وضع الإضاءة البيضاء الباردة (Cool White): مثالي لرؤية أدق تفاصيل الماكياج وتنسيق الإطلالة في النهار.',
    'warm': 'وضع الإضاءة الدافئة (Warm Light): إضاءة رومانسية ناعمة تحاكي أجواء المساء والسهرات المريحة للعين.',
    'natural': 'وضع الإضاءة الطبيعية (Natural Daylight): محاكاة لضوء الشمس الطبيعي لمكياج واقعي ومتناسق بدون ظلال.'
  };

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');

      if (modePreview) {
        modePreview.className = `mode-preview-box mode-${mode}`;
      }
      if (modeStatusText) {
        modeStatusText.textContent = modeDescriptions[mode] || '';
      }
    });
  });

  // Delivery Tab Switching
  function setDeliveryType(type) {
    deliveryType = type;
    if (type === 'home') {
      tabHome.classList.add('active');
      tabOffice.classList.remove('active');
      communeGroup.style.display = 'block';
      addressGroup.style.display = 'block';
      officeGroup.style.display = 'none';

      communeSelect.setAttribute('required', 'required');
      addressInput.setAttribute('required', 'required');
      officeSelect.removeAttribute('required');
    } else {
      tabHome.classList.remove('active');
      tabOffice.classList.add('active');
      communeGroup.style.display = 'none';
      addressGroup.style.display = 'none';
      officeGroup.style.display = 'block';

      communeSelect.removeAttribute('required');
      addressInput.removeAttribute('required');
      officeSelect.setAttribute('required', 'required');
    }
  }

  if (tabHome && tabOffice) {
    tabHome.addEventListener('click', () => setDeliveryType('home'));
    tabOffice.addEventListener('click', () => setDeliveryType('office'));
  }

  // Populate Wilayas & Shipping Hubs
  const hubsByWilaya = {};
  function parseHubs() {
    if (typeof rawHubsData !== 'undefined') {
      const lines = rawHubsData.trim().split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const match = trimmed.match(/(\d{2})/);
        if (match) {
          const wilayaCode = match[1];
          const arabicMatch = trimmed.match(/[\u0600-\u06FF].+/);
          if (arabicMatch) {
            const officeName = arabicMatch[0].trim();
            if (!hubsByWilaya[wilayaCode]) {
              hubsByWilaya[wilayaCode] = [];
            }
            hubsByWilaya[wilayaCode].push(officeName);
          }
        }
      });
    }
  }

  function initWilayas() {
    parseHubs();

    if (wilayaSelect && typeof communesParWilaya !== 'undefined') {
      wilayaSelect.innerHTML = '<option value="" disabled selected>اختر الولاية (58 ولاية)</option>';
      Object.keys(communesParWilaya).forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        wilayaSelect.appendChild(opt);
      });

      wilayaSelect.addEventListener('change', () => {
        const selectedWilaya = wilayaSelect.value;

        // Populate Communes
        communeSelect.innerHTML = '<option value="" disabled selected>اختر البلدية / الدائرة</option>';
        const communes = communesParWilaya[selectedWilaya] || [];
        if (communes.length > 0) {
          communes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            communeSelect.appendChild(opt);
          });
          communeSelect.disabled = false;
        } else {
          communeSelect.disabled = true;
        }

        // Populate Offices
        officeSelect.innerHTML = '<option value="" disabled selected>اختر مكتب الشحن المتوفر</option>';
        const code = selectedWilaya.substring(0, 2);
        const offices = hubsByWilaya[code] || [];
        if (offices.length > 0) {
          offices.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            officeSelect.appendChild(opt);
          });
          officeSelect.disabled = false;
        } else {
          const opt = document.createElement('option');
          opt.value = '';
          opt.disabled = true;
          opt.selected = true;
          opt.textContent = 'لا توجد مكاتب متوفرة حالياً (يرجى اختيار توصيل للمنزل)';
          officeSelect.appendChild(opt);
          officeSelect.disabled = true;
        }
      });
    }
  }

  initWilayas();
  updatePackageUI(2);

  // Form Submission & Google Sheets Sync
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullNameInput').value.trim();
      const phone = phoneInput.value.trim();
      const wilaya = wilayaSelect.value;

      if (!fullName || !phone || !wilaya) {
        alert('يرجى ملء جميع الحقول المطلوبة.');
        return;
      }

      let commune = '';
      let address = '';
      let office = '';
      let fullShippingAddress = '';

      if (deliveryType === 'home') {
        commune = communeSelect.value;
        address = addressInput.value.trim();
        if (!commune || !address) {
          alert('يرجى اختيار البلدية وإدخال عنوان التوصيل للمنزل.');
          return;
        }
        fullShippingAddress = `${address}، بلدية ${commune}، ولاية ${wilaya} (توصيل للمنزل)`;
      } else {
        office = officeSelect.value;
        if (!office) {
          alert('يرجى اختيار مكتب الشحن.');
          return;
        }
        fullShippingAddress = `${office}، ولاية ${wilaya} (استلام من المكتب)`;
      }

      // Submit Button Loading State
      const submitBtn = orderForm.querySelector('.btn-submit-order');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
        جاري تسجيل طلبك...
      `;

      // Phone formatting (+213)
      let formattedPhone = phone;
      const cleanPhone = phone.replace(/\s+/g, '');
      if (!cleanPhone.startsWith('+213') && !cleanPhone.startsWith('213') && !cleanPhone.startsWith('00213')) {
        if (cleanPhone.startsWith('0')) {
          formattedPhone = '+213' + cleanPhone.substring(1);
        } else {
          formattedPhone = '+213' + cleanPhone;
        }
      }

      const pkg = packages[selectedPackageId];
      const orderNum = 'TIV-MIR-' + Math.floor(100000 + Math.random() * 900000);

      // Exact order details payload matching index.html format
      const orderDetails = {
        orderDate: new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' }),
        productName: 'مرآة زينة مضيئة للسيارة LED',
        qty: pkg.qty,
        colors: 'أبيض ناصع / LED 3 أوضاع',
        total: `${pkg.price} دج`,
        customerName: fullName,
        customerPhone: formattedPhone,
        deliveryType: deliveryType === 'home' ? 'منزل' : 'مكتب',
        wilaya: wilaya,
        commune: deliveryType === 'home' ? commune : '',
        address: deliveryType === 'home' ? address : office,
        orderNumber: orderNum,
        packageName: pkg.name,
        paymentMethod: 'الدفع عند الاستلام (COD)',
        shippingAddress: fullShippingAddress
      };

      // Store in localStorage
      localStorage.setItem('lastMirrorOrder', JSON.stringify(orderDetails));

      // Send to Google Sheets
      if (GOOGLE_SHEETS_WEBHOOK_URL) {
        fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderDetails)
        })
        .then(() => console.log('تم إرسال الطلب إلى جوجل شيت بنجاح.'))
        .catch(err => console.error('فشل الإرسال لجوجل شيت:', err));
      }

      // Show Success Modal after simulated delay
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;

        if (receiptOrderNum) receiptOrderNum.textContent = orderNum;
        if (receiptPackage) receiptPackage.textContent = pkg.name;
        if (receiptAddress) receiptAddress.textContent = `${wilaya} - ${deliveryType === 'home' ? commune : office}`;
        if (receiptTotal) receiptTotal.textContent = `${pkg.price} دج`;

        successModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }, 1200);
    });
  }

  // Close Success Modal & Trigger Purchase Event ONLY on "تم، شكراً لكم" button
  let purchaseTracked = false;
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      const pkg = packages[selectedPackageId];
      
      // إرسال حدث الشراء لفيسبوك بيكسل حصرياً عند النقر على زر تم شكراً لكم
      if (typeof fbq === 'function' && !purchaseTracked) {
        fbq('track', 'Purchase', {
          value: pkg ? pkg.price : 4900,
          currency: 'DZD',
          content_name: 'مرآة زينة مضيئة للسيارة LED',
          content_type: 'product',
          num_items: pkg ? pkg.qty : 2
        });
        purchaseTracked = true;
        console.log('Facebook Pixel Purchase event tracked successfully on "تم، شكراً لكم" click.');
      }
      
      successModal.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

// Data for Algerian Wilayas & Communes
const communesParWilaya = {
  "01 - أدرار": ["أدرار", "تامنطيط", "أولف", "تيميمون", "زاوية كنتة", "شروين", "تسابيت", "تمست", "سالي", "أقبلي", "أولاد عيسى", "برج باجي مختار", "رقان", "أوقروت"],
  "02 - الشلف": ["الشلف", "تنس", "بني حواء", "أبو الحسن", "هرنفة", "وادي الفضة", "الكريمية", "المرسى", "وادي سلي", "أولاد فارس", "الصبحة", "بوزغاية", "الزبوجة", "تاجنة", "عين مران", "بناي يعقوب", "الأربعاء", "الخميس"],
  "03 - الأغواط": ["الأغواط", "بريزينة", "عين ماضي", "الحاج المكي", "الغيشة", "سيدي بوزيد", "قصر الحيران", "الرقيبة", "تاجموت", "عين سيدي علي", "البيضاء", "تاويالة", "الخنق", "الرملة", "سبقاق", "حاسي الدلاعة", "وادي مرة", "العسافية"],
  "04 - أم البواقي": ["أم البواقي", "عين البيضاء", "عين مليلة", "سيقوس", "عين فكرون", "عين كرشة", "الحرميلية", "الضلعة", "عين ببوش", "البرج", "أولاد حملة", "الفجوج", "القيقبة", "الزرقاء", "بئر الشهداء", "عين الزيتون"],
  "05 - باتنة": ["باتنة", "بريكة", "رأس العيون", "عين التوتة", "مروانة", "سريانة", "منعة", "تازولت", "المعذر", "أولاد سي سليمان", "تيمقاد", "عين ياقوت", "فسديس", "تكوت", "الجزار", "أريس", "شير", "نقاوس", "الحاسي", "تالخمت"],
  "06 - بجاية": ["بجاية", "أقبو", "سيدي عيش", "القصر", "أوزلاقن", "تيشي", "صدوق", "الدريات", "تاوريرت إغيل", "شميني", "سوق أوفلا", "تيزي نثلاثة", "أملو", "إغيل علي", "أدكار", "بني كسيلة", "تالة حمزة", "سيدي عياد"],
  "07 - بسكرة": ["بسكرة", "طولقة", "سيدي عقبة", "ليشانة", "زريبة الوادي", "الحوش", "عين الناقة", "القصور", "المزيرعة", "فوغال", "الفيض", "الحاجب", "القنطرة", "أوماش", "أولاد جلال"],
  "08 - بشار": ["بشار", "بني ونيف", "العبادلة", "كرزاز", "تاغيت", "الواتة", "إقلي", "بني عباس", "أولاد سيدي الشيخ", "أولاد خضير", "القصابي"],
  "09 - البليدة": ["البليدة", "بوفاريك", "الأربعاء", "وادي العلايق", "الشريعة", "حمام ملوان", "بني تامو", "الصومعة", "موزاية", "شفة", "العفرون", "أولاد يعيش", "الروراوة", "بن خليل", "سيدي موسى", "بوعرفة"],
  "10 - البويرة": ["البويرة", "الأخضرية", "عين بسام", "بشلول", "الأربعاء", "بئر غبالو", "بوردج", "العجيبة", "الحجرة الزرقاء", "الهاشمية", "المعمورة", "وادي البردي"],
  "11 - تمنراست": ["تمنراست", "عين قزام", "عين أمقل", "إدلس", "تاظروك", "سيلت", "عين غار"],
  "12 - تبسة": ["تبسة", "بئر العاتر", "العوينات", "نقرين", "الماء الأبيض", "مرسط", "العقلة", "الشريعة", "صفصاف الوسرى", "بوقرن"],
  "13 - تلمسان": ["تلمسان", "غريس", "سبدو", "عين تالوت", "صبرة", "الرمشي", "سيدي الجيلالي", "عين يوسف", "حمام بوغرارة", "عين فزة"],
  "14 - تيارت": ["تيارت", "مدروة", "مهدية", "عين بوشقيف", "عين دزاريت", "قرطوفة", "سي عبد الغني", "وادي ليلي", "رحوية", "النعيمة"],
  "15 - تيزي وزو": ["تيزي وزو", "عين الحمام", "أزفون", "مقلع", "واقنون", "إيفيغاء", "أزرو", "بعقبة", "بوجيمة", "تيزي راشد", "تيزي غنيف", "الأربعاء ناث إيراثن"],
  "16 - الجزائر": ["الجزائر الوسطى", "القصبة", "حسين داي", "بئر مراد رايس", "باب الواد", "الرويبة", "بوزريعة", "زرالدة", "الدار البيضاء", "بئر خادم", "المحمدية", "الدرارية", "الجزائر الجديدة", "حيدرة", "حجرة حسين", "الواشنة", "الأبيار", "الرويبة", "برج البحري", "الشراقة", "عين البنيان", "باب الزوار", "برج الكيفان"],
  "17 - الجلفة": ["الجلفة", "عين وسارة", "دار الشيوخ", "الشارف", "حد الصحاري", "عين الإبل", "مسعد", "زعفران", "القديد", "سيدي لعجال", "تعظميت", "فيض البطمة"],
  "18 - جيجل": ["جيجل", "الميلية", "الطاهير", "القنار", "سيدي معروف", "الشقفة", "غبالة", "بوراوي بلهادف", "العوانة", "أم عبود", "زيامة منصورية", "السطارة"],
  "19 - سطيف": ["سطيف", "عين أرنات", "عين ولمان", "عين آزال", "بئر العرش", "بوعنداس", "جميلة", "قنزات", "صالح باي", "القلتة الزرقاء", "حمام قرقور", "معاوية", "العلمة"],
  "20 - سعيدة": ["سعيدة", "دوي ثايل", "أولاد إبراهيم", "سيدي عمر", "سيدي أحمد", "عين الحجر", "البيض", "يوب", "حدادة", "مشيرة"],
  "21 - سكيكدة": ["سكيكدة", "الحروش", "ابن بسلة", "مشوار", "سيدي عبد العزيز", "العلمة", "برحال", "الطرشان", "القل", "عزابة"],
  "22 - سيدي بلعباس": ["سيدي بلعباس", "تسالة", "مرين", "رأس الماء", "سيدي علي بوسيدي", "تلمون", "عين أدن", "مزاورو", "سيدي لحسن", "بطيوة", "سيدي إبراهيم", "حمام ريغة"],
  "23 - عنابة": ["عنابة", "برحال", "الشرفة", "العنصر", "وادي العنب", "البوني", "الحجار", "سرايدي", "شطايبي", "تريعات"],
  "24 - قالمة": ["قالمة", "هيليوبوليس", "وادي الزناتي", "بوشقوف", "عين بن بيضاء", "بومهرة", "حمام دباغ", "حمام النبايل", "لخزارة", "وادي فراغة"],
  "25 - قسنطينة": ["قسنطينة", "الخروب", "زيغود يوسف", "عين سمارة", "حامة بوزيان", "درايس", "ابن زياد", "ابن باديس", "مليلية", "مروانة", "علي منجلي"],
  "26 - المدية": ["المدية", "وزرة", "العزيزية", "الشيخ", "العيساوية", "تمسقيدة", "سيدي نعمان", "العمارية", "الكاف", "بوعيش", "أولاد عنتر", "أولاد هلال", "البرواقية"],
  "27 - مستغانم": ["مستغانم", "حجاج", "خير الدين", "مزغران", "عين تادلس", "سيدي علي", "بوقيراط", "الصفصاف", "عشعاشة", "خضرة", "ستيدية"],
  "28 - المسيلة": ["المسيلة", "بوسعادة", "أولاد دراج", "سيدي عامر", "عين الحجل", "عين الملح", "حمام الضلعة", "الهامل", "مقرة", "أولاد ماضي", "سليم", "الخبانة"],
  "29 - معسكر": ["معسكر", "سيق", "غريس", "وادي الأبطال", "زهانة", "ماوسطة", "مقطع دوز", "عين فراح", "البرج", "خليل", "المامونية", "قرجوم", "تيغنيف"],
  "30 - ورقلة": ["ورقلة", "حاسي مسعود", "انقوسة", "الطيبات", "سيدي خويلد", "حاسي بن عبد الله", "العقلة", "بئر بير", "الرويسات", "النزلة"],
  "31 - وهران": ["وهران", "بئر الجير", "الأبيار", "السانية", "عين الترك", "قديل", "بطيوة", "أرزيو", "حاسي بونيف", "الكرمة", "بوسفر", "بوتليليس", "سيدي الشحمي"],
  "32 - البيض": ["البيض", "بوقطب", "الغاسول", "الأبيض", "بريزينة", "الشقيق", "الخيثر", "كراكدة", "رأس الماء", "بوسمغون"],
  "33 - إليزي": ["إليزي", "جانت", "برج عمر إدريس", "إن أميناس"],
  "34 - برج بوعريريج": ["برج بوعريريج", "رأس الوادي", "برج زمورة", "الحمادية", "الميلية", "عين تاغروت", "غيلاسة", "المعاصم", "مجانة", "المنصورة"],
  "35 - بومرداس": ["بومرداس", "بودواو", "بغلية", "الثنية", "دلس", "زموري", "الناصرية", "يسر", "أوقاس", "خميس الخشنة", "برج منايل"],
  "36 - الطارف": ["الطارف", "بن مهيدي", "البسباس", "بوحجار", "الطارف", "العيون", "زريزر", "الشط", "عين العسل", "الذرعان"],
  "37 - تندوف": ["تندوف", "أوم العير"],
  "38 - تيسمسيلت": ["تيسمسيلت", "برج بونعامة", "لرجام", "ثنية الحد", "الأزهرية", "عميرة", "بني شعيب", "سيدي بوتشنت", "سيدي عابد", "تملاحت"],
  "39 - الوادي": ["الوادي", "البياضة", "رباح", "الرقيبة", "حساني عبد الكريم", "قمار", "المقرن", "اميه وانسة", "سطيل", "تغزوت"],
  "40 - خنشلة": ["خنشلة", "قايس", "بغاي", "شلية", "الحامة", "عين الطويلة", "يابوس", "الولجة", "المحمل", "ام العظائم"],
  "41 - سوق أهراس": ["سوق أهراس", "سدراتة", "المراهنة", "تاورة", "الزوابي", "الحدادة", "الخضارة", "أولاد إدريس", "الزعرور", "الطاية"],
  "42 - تيبازة": ["تيبازة", "شرشال", "فوكة", "القليعة", "حجوط", "سيدي راشد", "عين تاقورايت", "مسلمون", "سيدي سميان", "بوهارون", "خميستي", "الدواودة", "بوسماعيل"],
  "43 - ميلة": ["ميلة", "فرجيوة", "شلغوم العيد", "تاجنانت", "عين البيضاء", "سيدي مروان", "التلاغمة", "ترعي باينان", "أولاد اخلوف", "الرواشد"],
  "44 - عين الدفلى": ["عين الدفلى", "مليانة", "بومدفع", "العامرة", "برج الأمير خالد", "جندل", "العبادية", "عين لشياخ", "الحسينية", "روينة", "خميس مليانة"],
  "45 - النعامة": ["النعامة", "مغرار", "عين الصفراء", "عين بن خليل", "مكمن بن عمار", "الصفصاف", "المشرية", "سفيسيفة", "عسلة"],
  "46 - عين تموشنت": ["عين تموشنت", "حمام بوحجر", "بني صاف", "العين", "الأمير عبد القادر", "عين الأربعاء", "الأمير", "سيدي بن عدة", "حاسي الغلة", "بوجبهور البرج"],
  "47 - غرداية": ["غرداية", "متليلي", "المنيعة", "ضاية بن ضحوة", "بونورة", "القرارة", "بريان", "أقلي", "حاسي القارة", "زلفانة"],
  "48 - غليزان": ["غليزان", "وادي رهيو", "الحمادنة", "عمي موسى", "عين طارق", "القلعة", "منداس", "وزرة", "سيدي سعادة", "بني درقن", "مازونة"],
  "49 - توقرت": ["توقرت", "تماسين", "الطيبات", "الخبرة", "مغيلة", "النزلة"],
  "50 - جانت": ["جانت", "برج الحواس", "إيليزي"],
  "51 - المغير": ["المغير", "سطيل", "جامعة", "المنقر", "النخلة", "الزويرات"],
  "52 - المنيعة": ["المنيعة", "حاسي الفحل", "الغرارة", "بونوارة", "المطارفة", "العقلة"],
  "53 - عين صالح": ["عين صالح", "إن غار", "تيمياوين", "أقبيل", "المطارفة", "السبع"],
  "54 - عين قزام": ["عين قزام", "تين زواتين", "إيسين", "أمقيد", "أنغول", "تارك"],
  "55 - برج باجي مختار": ["برج باجي مختار", "تيمياوين", "المالكية", "السبع", "العوينات"],
  "56 - بني عباس": ["بني عباس", "تيمودي", "القصابي", "المطارفة", "تاغيت", "كرزاز"],
  "57 - أولاد جلال": ["أولاد جلال", "الفيض", "الحاجب", "المزيرعة", "بسكرة", "طولقة"],
  "58 - إن صالح": ["إن صالح", "عين صالح", "تيمياوين", "المطارفة", "السبع", "العوينات"]
};

const rawHubsData = `
Hub Adrar 01 مكتب أدرار
Hub Chlef 02 مكتب الشلف
hub Ténès 02 مكتب تـنـس
Hub Laghouat 03 مكتب الأغواط
Hub Ain El Beida04مكتب عين البيضاء
Oum El Bouaghi04مكتب أم بواقي
Hub Batna 05 مكتب باتنة
Hub Bejaia 06 مكتب بجاية
Hub Akbou 06 مكتب أقبو
Hub Biskra 07 مكتب بسكرة
Hub Ouled Djellal 51 مكتب أولاد جلال
Hub Béchar 08 مكتب بشار
Hub Beni Abbes 52 مكتب بني عباس
Hub Blida 09 مكتب البليدة
Hub Bougara 09 مكتب بوقرة
Hub Mouzaia 09 مكتب موزاية
Hub Bouira 10 مكتب البويرة
Hub Tamanrasset 11 مكتب تامنراست
Hub Tebessa 12 مكتب تبسة
Hub Tlemcen 13 مكتب تلمسان
Hub Tiaret 14 مكتب تيارت
Hub Tizi Ouzou 15 مكتب تيزي وزو
Hub El Jomhoria 16 مكتب الجمهورية
Hub Reghaia 16  مكتب رغاية
Hub Birtouta 16 مكتب بئرتوتة
Hub Ouled Fayet 16 مكتب أولاد فايت
Hub Birkhadem 16 مكتب بئرخادم
Hub Baraki 16 مكتب براقي
Hub Lidou 16  مكتب برج الكيفان
Hub Djelfa 17 مكتب الجلفة
Hub Jijel 18 مكتب جيجل
Hub Taher 18 مكتب الطاهير
Hub Setif 19 مكتب سطيف
Hub El Eulma 19 مكتب العلمة
Hub Saida 20 مكتب سعيدة
Hub Skikda 21 مكتب سكيكدة
Hub Sidi Belabes 22 مكتب سيدي بلعباس
Hub Annaba 23 عنابة مكتب عنابة
Hub El Bouni 23 مكتب البوني
Hub Guelma 24 مكتب قالمة
Hub Belle vue 25 مكتب المنظر الجميل
Hub Constantine 25 مكتب قسنطينة
Hub Zouaghi 25 مكتب زواغي
Hub Médéa 26 مكتب المدية
Hub Mostaganem 27 مكتب مستغانم
Hub M'sila 28 مكتب مسيلة
Hub Bou Saada 28 مكتب بوسعادة
Hub Mascara 29 مكتب معسكر
Hub Touggourt 55 مكتب تقرت
Hub Hassi Messaoud 30 مكتب حاسي مسعود
Hub Ouargla 30 مكتب ورقلة
Hub Canastel 31 مكتب كاناستال
Hub El Morchid 31 مكتب المرشد
Hub Maraval 31 مكتب مارافال
Hub El Bayadh 32 مكتب البيض
Hub Bordj bouareridj 34 مكتب برج بوعريريج
Hub Boumerdes 35 مكتب بومرداس
Hub Bordj menaiel 35 مكتب برج منايل
Hub El Tarf 36 مكتب الطارف
Hub Tissemsilt 38 مكتب تيسمسيلت
Hub El Oued 39 مكتب الوادي
Hub Khenchela 40 مكتب خنشلة
Hub Souk Ahras 41 مكتب سوق أهراس
Hub Tipaza 42 مكتب تيبازة
Hub Kolea 42 مكتب القليعة
Hub Mila 43 مكتب ميلة
Hub Ain Defla 44 مكتب عين الدفلة
Hub Naama 45 مكتب النعامة
Hub Ain Temouchent 46 مكتب عبن تموشنت
Hub Ghardaia 47 مكتب غرداية
Hub Relizane 48 مكتب غيليزان
Hub Timimoune 49 مكتب تيميمون
Hub In Salah 53 مكتب عين صالح
Hub El Meghaier 57 مكتب المغير
`;
