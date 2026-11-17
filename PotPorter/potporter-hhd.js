/**
 * Tivaro - PotPorter (حامل طنجرة الأكل للرحلات العائلية) - نسخة مكاتب HHD Express
 * Google Sheets Webhook Integration, 58 Wilayas Selector & Facebook Pixel Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- رابط جوجل شيت Webhook ---
  const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwWh1yCjF6mC-wMyYeH3nbDajCYgE3MbJlr_uwjZT_xsgDQBTIW5OeNXerSMBFbgTRbpw/exec';

  // --- باقات وعروض حامل الطنجرة ---
  const packages = {
    1: {
      id: 1,
      name: 'قطعة واحدة (1)',
      qty: 1,
      price: 1450,
      originalPrice: 2000,
      badge: 'الطلب الأساسي',
      shippingText: 'توصيل سريع'
    },
    2: {
      id: 2,
      name: 'قطعتين (2 قطع)',
      qty: 2,
      price: 2200,
      originalPrice: 2900,
      badge: 'الأكثر طلباً 🔥',
      shippingText: 'وفر 700 دج!'
    },
    3: {
      id: 3,
      name: '3 قطع (عرض خاص)',
      qty: 3,
      price: 2900,
      originalPrice: 4350,
      badge: 'عرض التوفير الأكبر 🎁',
      shippingText: 'وفر 1450 دج!'
    }
  };

  const availableColors = ['أحمر', 'برتقالي', 'أسود', 'أزرق'];

  let selectedPackageId = 2; // Default to 2 pieces
  let deliveryType = 'home'; // 'home' or 'office'

  // DOM Elements
  const header = document.querySelector('header');
  const packageCards = document.querySelectorAll('.package-option-card');
  const orderForm = document.getElementById('potPorterOrderForm');
  const summaryPackageName = document.getElementById('summaryPackageName');
  const summaryQty = document.getElementById('summaryQty');
  const summaryTotal = document.getElementById('summaryTotal');
  const countdownTimer = document.getElementById('countdownTimer');
  const colorPickerContainer = document.getElementById('colorPickerContainer');
  
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
  const phoneError = document.getElementById('phoneError');

  // Modal Elements
  const successModal = document.getElementById('orderSuccessModal');
  const closeModalBtn = document.getElementById('closeSuccessModal');
  const receiptOrderNum = document.getElementById('receiptOrderNum');
  const receiptPackage = document.getElementById('receiptPackage');
  const receiptColors = document.getElementById('receiptColors');
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

  // Hero Thumbnails Switcher
  const mainHeroImg = document.getElementById('mainHeroImg');
  const heroThumbs = document.querySelectorAll('.hero-thumb');
  if (mainHeroImg && heroThumbs.length > 0) {
    heroThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        heroThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const imgSrc = thumb.getAttribute('data-img');
        if (imgSrc) {
          mainHeroImg.style.opacity = '0.4';
          setTimeout(() => {
            mainHeroImg.src = imgSrc;
            mainHeroImg.style.opacity = '1';
          }, 150);
        }
      });
    });
  }

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

  // Phone input validation helpers
  function showPhoneError(msg) {
    if (!phoneInput) return;
    phoneInput.classList.remove('is-valid');
    phoneInput.classList.add('is-invalid');
    if (phoneError) {
      phoneError.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${msg}</span>
      `;
      phoneError.style.display = 'flex';
    }
  }

  function showPhoneSuccess() {
    if (!phoneInput) return;
    phoneInput.classList.remove('is-invalid');
    phoneInput.classList.add('is-valid');
    if (phoneError) {
      phoneError.style.display = 'none';
      phoneError.innerHTML = '';
    }
  }

  function clearPhoneStatus() {
    if (!phoneInput) return;
    phoneInput.classList.remove('is-invalid');
    phoneInput.classList.remove('is-valid');
    if (phoneError) {
      phoneError.style.display = 'none';
      phoneError.innerHTML = '';
    }
  }

  function validatePhoneNumber(value, isSubmittingOrBlur = false) {
    const clean = (value || '').replace(/[^0-9]/g, '');

    if (clean.length === 0) {
      if (isSubmittingOrBlur) {
        showPhoneError('يرجى إدخال رقم الهاتف.');
        return false;
      }
      clearPhoneStatus();
      return false;
    }

    // Must start with 05, 06, or 07
    if (clean.length === 1) {
      if (clean !== '0') {
        showPhoneError('يجب أن يبدأ رقم الهاتف بـ 05 أو 06 أو 07');
        return false;
      } else {
        clearPhoneStatus();
        return false;
      }
    }

    if (clean.length >= 2 && !clean.startsWith('05') && !clean.startsWith('06') && !clean.startsWith('07')) {
      showPhoneError('رقم الهاتف غير صحيح! يجب أن يبدأ بـ 05 أو 06 أو 07');
      return false;
    }

    // Checking length
    if (clean.length < 10) {
      if (isSubmittingOrBlur) {
        showPhoneError(`رقم الهاتف ناقص (${clean.length} من 10 أرقام)! يرجى إدخال 10 أرقام كاملة.`);
        return false;
      } else {
        clearPhoneStatus();
        return false;
      }
    }

    // Exactly 10 digits and valid prefix
    if (/^0[567][0-9]{8}$/.test(clean)) {
      showPhoneSuccess();
      return true;
    } else {
      showPhoneError('رقم الهاتف غير صحيح. يرجى إدخال 10 أرقام تبدأ بـ 05 أو 06 أو 07');
      return false;
    }
  }

  // Phone input event listeners
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length > 10) {
        val = val.slice(0, 10);
      }
      e.target.value = val;
      validatePhoneNumber(val, false);
    });

    phoneInput.addEventListener('blur', (e) => {
      validatePhoneNumber(e.target.value, true);
    });
  }

  // Render Dynamic Color Selectors based on package quantity
  function renderColorPickers(qty) {
    if (!colorPickerContainer) return;
    colorPickerContainer.innerHTML = '';

    for (let i = 1; i <= qty; i++) {
      const row = document.createElement('div');
      row.className = 'item-color-row';

      const label = document.createElement('span');
      label.className = 'item-color-label';
      label.textContent = qty === 1 ? 'اختر لون القطعة:' : `لون القطعة رقم #${i}:`;

      const select = document.createElement('select');
      select.className = 'item-color-select color-select-input';
      select.name = `item_color_${i}`;

      availableColors.forEach((col, idx) => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        // Default color variation
        if ((i - 1) % availableColors.length === idx) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      row.appendChild(label);
      row.appendChild(select);
      colorPickerContainer.appendChild(row);
    }
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

    renderColorPickers(pkg.qty);
  }

  packageCards.forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.getAttribute('data-package'));
      updatePackageUI(id);
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

      if (!fullName) {
        alert('يرجى إدخال الاسم الكامل.');
        document.getElementById('fullNameInput').focus();
        return;
      }

      // Phone validation (Algerian mobile numbers: exactly 10 digits starting with 05, 06, or 07)
      const isPhoneValid = validatePhoneNumber(phone, true);
      if (!isPhoneValid) {
        phoneInput.classList.remove('shake');
        void phoneInput.offsetWidth;
        phoneInput.classList.add('shake');
        phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneInput.focus();
        return;
      }

      if (!wilaya) {
        alert('يرجى اختيار الولاية.');
        wilayaSelect.focus();
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

      // Collect selected colors
      const chosenColors = [];
      const colorSelects = document.querySelectorAll('.color-select-input');
      colorSelects.forEach(sel => {
        chosenColors.push(sel.value);
      });
      const colorsString = chosenColors.join(' + ');

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
      const orderNum = 'TIV-POT-' + Math.floor(100000 + Math.random() * 900000);

      // Exact order details payload matching index.html format
      const orderDetails = {
        orderDate: new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' }),
        productName: 'حامل طنجرة الأكل للرحلات العائلية',
        qty: pkg.qty,
        colors: colorsString,
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
      localStorage.setItem('lastPotPorterOrder', JSON.stringify(orderDetails));

      // إرسال حدث الشراء لفيسبوك بيكسل (عند توفره في الصفحة مثل index.html)
      if (typeof fbq === 'function') {
        fbq('track', 'Purchase', {
          value: pkg ? pkg.price : 2200,
          currency: 'DZD',
          content_name: 'حامل طنجرة الأكل للرحلات العائلية',
          content_type: 'product',
          num_items: pkg ? pkg.qty : 2
        });
        console.log('Facebook Pixel Purchase event tracked successfully on "طلب المنتج".');
      }

      // إرسال بيانات المطابقة المتقدمة وحدث الشراء لتيك توك بيكسل (TikTok Pixel Identify & Purchase)
      if (typeof window.trackTikTokPurchase === 'function') {
        window.trackTikTokPurchase({
          phone: formattedPhone || phone,
          orderNum: orderNum,
          pkg: pkg
        });
      } else if (typeof ttq !== 'undefined' && typeof ttq.track === 'function') {
        (async () => {
          try {
            const sha256Fallback = async (str) => {
              if (!str) return '';
              try {
                const buffer = new TextEncoder().encode(str.toString().trim().toLowerCase());
                const hash = await crypto.subtle.digest('SHA-256', buffer);
                return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
              } catch (e) { return ''; }
            };

            const hashedPhone = await sha256Fallback(formattedPhone || phone);
            const hashedOrderId = await sha256Fallback(orderNum);

            if (typeof ttq.identify === 'function') {
              ttq.identify({
                phone_number: hashedPhone,
                external_id: hashedOrderId
              });
            }

            const orderValue = pkg ? pkg.price : 2200;
            const prodId = 'pot-porter-' + (pkg ? pkg.id : '2');
            const prodName = 'حامل طنجرة الأكل للرحلات العائلية';

            ttq.track('Purchase', {
              contents: [
                {
                  content_id: prodId,
                  content_name: prodName
                }
              ],
              value: orderValue,
              currency: 'DZD'
            });

            ttq.track('CompletePayment', {
              contents: [
                {
                  content_id: prodId,
                  content_name: prodName
                }
              ],
              content_id: prodId,
              content_name: prodName,
              quantity: pkg ? pkg.qty : 2,
              price: orderValue,
              value: orderValue,
              currency: 'DZD'
            });

            console.log('TikTok Pixel: identify & Purchase tracked successfully.');
          } catch (err) {
            console.error('TikTok Pixel Tracking Error:', err);
          }
        })();
      }

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
        if (receiptColors) receiptColors.textContent = colorsString;
        if (receiptAddress) receiptAddress.textContent = `${wilaya} - ${deliveryType === 'home' ? commune : office}`;
        if (receiptTotal) receiptTotal.textContent = `${pkg.price} دج`;

        successModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }, 1200);
    });
  }

  // Close Success Modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
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

// مكاتب شركة HHD Express الرسمية المعتمدة
const rawHubsData = `
01- STATION ADRAR مكتب أدرار
02- STATION CHLEF مكتب الشلف
02- STATION BOUKADIR مكتب بوقادير
03- STATION LAGHOUAT مكتب الأغواط
04- STATION OUM EL BOUAGHI مكتب أم البواقي
04- STATION AIN FEKROUNE مكتب عين فكرون
05- STATION BATNA مكتب باتنة
06- STATION BEJAIA مكتب بجاية
07- STATION BISKRA مكتب بسكرة
08- STATION BECHAR مكتب بشار
09- STATION BLIDA مكتب البليدة
09- STATION BOUFARIK مكتب بوفاريك
09- STATION BENI TAMOU مكتب بني تامو
09- STATION BOUGARA مكتب بوقرة
09- STATION EL AFFROUN مكتب العفرون
10- STATION BOUIRA مكتب البويرة
10- STATION LAKHDARIA مكتب الأخضرية
11- STATION TAMENRASET مكتب تمنراست
12- STATION TEBESSA مكتب تبسة
13- STATION TLEMCEN مكتب تلمسان
13- STATION MAGHNIA مكتب مغنية
13- STATION SEBDOU مكتب سبدو
14- STATION TIARET مكتب تيارت
15- STATION TIZI OUZOU مكتب تيزي وزو
16- STATION BAB EL OUED مكتب باب الواد
16- STATION BORDJ EL BAHRI مكتب برج البحري
16- STATION ZERALDA مكتب زرالدة
16- STATION AIN MALHA مكتب عين المالحة (بئر خادم)
16- STATION REGHAIA مكتب الرغاية
16- STATION BIRTOUTA مكتب بئر توتة
16- STATION CHERAGA مكتب الشراقة
16- STATION BAB EZZOUAR مكتب باب الزوار
16- STATION EL HARRACH مكتب الحراش
16- STATION DRARIA مكتب الدرارية
16- STATION BARAKI مكتب براقي
17- STATION DJELFA مكتب الجلفة
17- STATION AIN OUSSERA مكتب عين وسارة
18- STATION JIJEL مكتب جيجل
19- STATION EL HIDHAB مكتب سطيف (الهضاب)
19- STATION EL HIDHAB 2 مكتب عين أرنات (الهضاب 2)
19- STATION EL EULMA مكتب العلمة
19- STATION AIN OULMANE مكتب عين ولمان
20- STATION SAIDA مكتب سعيدة
21- STATION SKIKDA مكتب سكيكدة
21- STATION AZZABA مكتب عزابة
22- STATION SIDI BEL ABBES مكتب سيدي بلعباس
23- STATION ANNABA مكتب عنابة
23- STATION EL BOUNI مكتب البوني
24- STATION GUELMA مكتب قالمة
25- STATION CONSTANTINE مكتب قسنطينة
25- STATION EL KHROUB مكتب الخروب
26- STATION MEDEA مكتب المدية
26- STATION BERROUAGHIA مكتب البرواقية
26- STATION KSAR BOUKHARI مكتب قصر البخاري
27- STATION MOSTAGANEM مكتب مستغانم
28- STATION M'SILA مكتب المسيلة
29- STATION MASCARA مكتب معسكر
30- STATION OUARGLA مكتب ورقلة
31- STATION MARAVEL مكتب وهران (مارافال)
31- STATION BIR EL DJIR مكتب بئر الجير
32- STATION EL BAYADH مكتب البيض
34- STATION BBA مكتب برج بوعريريج
35- STATION BOUMERDES مكتب بومرداس
35- STATION BORDJ MENAIEL مكتب برج منايل
35- STATION KHEMIS EL KHECHNA مكتب خميس الخشنة
36- STATION EL TARF مكتب الطارف
38- STATION TISSEMSILT مكتب تيسمسيلت
39- STATION EL OUED مكتب الوادي
40- STATION KHENCHLA مكتب خنشلة
41- STATION SOUK AHRAS مكتب سوق أهراس (مداوروش)
42- STATION TIPAZA مكتب تيبازة
42- STATION KOLEA مكتب القليعة
42- STATION HADJOUT مكتب حجوط
42- STATION CHERCHELL مكتب شرشال
43- STATION MILA مكتب ميلة
43- STATION TADJENANET مكتب تاجنانت
44- STATION AIN DEFLA مكتب عين الدفلى
45- STATION NAAMA مكتب النعامة
46- STATION AIN TEMOUCHENT مكتب عين تموشنت
47- STATION GHARDAIA مكتب غرداية
48- STATION RELIZANE مكتب غليزان
49- STATION TOUGGOURT مكتب توقرت
51- STATION EL M'GHIR مكتب المغير
52- STATION EL MENIAA مكتب المنيعة
55- STATION TOUGGOURT مكتب توقرت
57- STATION EL M'GHIR مكتب المغير
58- STATION EL MENIAA مكتب المنيعة
`;
