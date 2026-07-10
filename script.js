document.addEventListener('DOMContentLoaded', () => {
  // --- إعدادات ربط جوجل شيت (Google Sheets Configuration) ---
  // انسخ رابط الويب أب (Web App URL) الخاص بك من تطبيقات جوجل ولصقه هنا
  const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwWh1yCjF6mC-wMyYeH3nbDajCYgE3MbJlr_uwjZT_xsgDQBTIW5OeNXerSMBFbgTRbpw/exec';
  
  // --- بيانات العروض والأسعار بالدينار الجزائري (دج) ---
  const packages = {
    1: {
      id: 1,
      title: 'حقيبة واحدة (1)',
      subtitle: 'الأساسية اليومية',
      price: 1800,
      originalPrice: 2500,
      bagCount: 1,
      discountText: ''
    },
    2: {
      id: 2,
      title: 'حقيبتين (2)',
      subtitle: 'الراحة المزدوجة',
      price: 2900,
      originalPrice: 5000,
      bagCount: 2,
      discountText: 'وفر 700 دج! 🔥'
    },
    3: {
      id: 3,
      title: '3 حقائب (عرض خاص)',
      subtitle: 'مجموعة التوفير الأكبر',
      price: 3200,
      originalPrice: 4500,
      bagCount: 3,
      discountText: '3 قطع بـ 3200 دج فقط! 🔥'
    }
  };

  // إدارة حالة الصفحة
  let selectedPackageId = 3; // نجعل عرض 3 حقائب هو المختار تلقائياً لزيادة المبيعات
  let paymentMethod = 'cod'; // الدفع عند الاستلام
  
  // عناصر DOM
  const header = document.querySelector('header');
  const packageCards = document.querySelectorAll('.package-card');
  const drawerBackdrop = document.getElementById('orderDrawerBackdrop');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const openDrawerBtns = document.querySelectorAll('.open-drawer-btn');
  const orderForm = document.getElementById('orderForm');
  const successModalBackdrop = document.getElementById('successModalBackdrop');
  const successCloseBtn = document.getElementById('successCloseBtn');
  
  // عناصر حساب الأسعار في درج الطلب
  const drawerProductName = document.getElementById('drawerProductName');
  const drawerQty = document.getElementById('drawerQty');
  const drawerDiscountRow = document.getElementById('drawerDiscountRow');
  const drawerDiscountVal = document.getElementById('drawerDiscountVal');
  const drawerTotal = document.getElementById('drawerTotal');
  const drawerBagConfigs = document.getElementById('drawerBagConfigs');
  
  // --- تأثير التمرير للهيدر (Scroll) ---
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- شريط مؤقت التوصيل والتواريخ بالعربية ---
  function updateShippingInfo() {
    const countdownEl = document.getElementById('countdown-timer');

    // عداد التنازلي لنهاية اليوم الحالي
    function updateTimer() {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay - now;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (countdownEl) {
        countdownEl.textContent = `${hours} ساعة و ${minutes} دقيقة`;
      }
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
  }
  updateShippingInfo();

  // --- اختيار العروض من الشبكة ---
  packageCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.custom-select-wrapper')) return; // لا نغير العرض عند اختيار اللون فقط
      
      const packageId = parseInt(card.getAttribute('data-package-id'));
      selectPackage(packageId);
    });
  });

  function selectPackage(packageId) {
    selectedPackageId = packageId;
    
    // تحديث الشكل النشط في الواجهة
    packageCards.forEach(card => {
      const cardId = parseInt(card.getAttribute('data-package-id'));
      if (cardId === packageId) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    // تحديث عدد الأغراض في أيقونة سلة المشتريات
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = packages[packageId].bagCount;
    }
  }

  // تهيئة الاختيار الأولي (تحديد العرض الثالث تلقائياً)
  selectPackage(3);

  // --- أزرار وتمرير الكاروسيل (Carousel) يدعم اتجاه الـ RTL ---
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  
  if (track && prevBtn && nextBtn) {
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    let currentIndex = 0;
    
    const cardWidth = 320 + 25; // عرض البطاقة + الفراغ
    
    function updateCarouselButtons() {
      if (currentIndex <= 0) {
        prevBtn.classList.add('disabled');
      } else {
        prevBtn.classList.remove('disabled');
      }
      
      const maxScrollable = track.scrollWidth - track.parentElement.clientWidth;
      if (Math.abs(currentTranslate) >= maxScrollable - 10) {
        nextBtn.classList.add('disabled');
      } else {
        nextBtn.classList.remove('disabled');
      }
    }

    // الانتقال لبطاقة محددة
    function scrollToIndex(index) {
      const maxScrollable = track.scrollWidth - track.parentElement.clientWidth;
      const directionMultiplier = -1;
      
      let targetTranslate = directionMultiplier * index * cardWidth;
      
      if (Math.abs(targetTranslate) > maxScrollable) {
        targetTranslate = directionMultiplier * maxScrollable;
        currentIndex = Math.ceil(maxScrollable / cardWidth);
      } else {
        currentIndex = index;
      }
      
      if (targetTranslate > 0) targetTranslate = 0;
      if (targetTranslate < -maxScrollable) targetTranslate = -maxScrollable;
      
      currentTranslate = targetTranslate;
      prevTranslate = currentTranslate;
      track.style.transform = `translateX(${currentTranslate}px)`;
      updateCarouselButtons();
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      }
    });

    nextBtn.addEventListener('click', () => {
      const maxScrollable = track.scrollWidth - track.parentElement.clientWidth;
      if (Math.abs(currentTranslate) < maxScrollable) {
        scrollToIndex(currentIndex + 1);
      }
    });

    // السحب واللمس
    track.addEventListener('mousedown', dragStart);
    track.addEventListener('touchstart', dragStart);
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('touchend', dragEnd);
    track.addEventListener('mousemove', dragAction);
    track.addEventListener('touchmove', dragAction);

    function dragStart(e) {
      isDragging = true;
      startX = getPositionX(e);
      track.style.transition = 'none';
      cancelAnimationFrame(animationID);
    }

    function dragAction(e) {
      if (!isDragging) return;
      const currentX = getPositionX(e);
      const diffX = currentX - startX;
      currentTranslate = prevTranslate + diffX;
      
      // الحدود
      const maxScrollable = track.scrollWidth - track.parentElement.clientWidth;
      
      if (currentTranslate > 0) currentTranslate = 0;
      if (currentTranslate < -maxScrollable) currentTranslate = -maxScrollable;
      
      track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      
      currentIndex = Math.round(Math.abs(currentTranslate) / cardWidth);
      scrollToIndex(currentIndex);
    }

    function getPositionX(e) {
      return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    window.addEventListener('resize', () => scrollToIndex(currentIndex));
    updateCarouselButtons();
  }

  // --- تشغيل وإيقاف الفيديوهات بنقرة واحدة ---
  const videos = document.querySelectorAll('.carousel-card video');
  videos.forEach(video => {
    const playBtn = video.parentElement.querySelector('.video-play-btn');
    
    const togglePlay = () => {
      if (video.paused) {
        videos.forEach(v => {
          if (v !== video) {
            v.pause();
            const btn = v.parentElement.querySelector('.video-play-btn');
            if (btn) btn.style.display = 'flex';
          }
        });
        
        video.play();
        if (playBtn) playBtn.style.display = 'none';
      } else {
        video.pause();
        if (playBtn) playBtn.style.display = 'flex';
      }
    };
    
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
  });

  // --- منطق درج تأكيد الطلب الشريطي ---
  openDrawerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // إذا كان الزر داخل بطاقة العرض، نقوم بتحديد العرض أولاً لضمان مزامنة البيانات
      const card = btn.closest('.package-card');
      if (card) {
        const packageId = parseInt(card.getAttribute('data-package-id'));
        selectPackage(packageId);
      }
      
      const method = btn.getAttribute('data-payment-method');
      paymentMethod = method || 'cod';
      openOrderDrawer();
    });
  });

  drawerCloseBtn.addEventListener('click', closeOrderDrawer);
  drawerBackdrop.addEventListener('click', (e) => {
    if (e.target === drawerBackdrop) closeOrderDrawer();
  });

  // --- مستمعات الأحداث لشرائح تغيير العرض في الدرج ---
  const drawerSegments = document.querySelectorAll('.segment-opt');
  drawerSegments.forEach(segment => {
    segment.addEventListener('click', () => {
      const packageId = parseInt(segment.getAttribute('data-package-id'));
      selectPackage(packageId);
      setupDrawerPricing();
      setupDrawerBagConfigs();
      updateDrawerSegmentsActiveState(packageId);
    });
  });

  function updateDrawerSegmentsActiveState(packageId) {
    drawerSegments.forEach(segment => {
      const segId = parseInt(segment.getAttribute('data-package-id'));
      if (segId === packageId) {
        segment.classList.add('active');
      } else {
        segment.classList.remove('active');
      }
    });
  }

  function openOrderDrawer() {
    setupDrawerPricing();
    setupDrawerBagConfigs();
    updateDrawerSegmentsActiveState(selectedPackageId);
    drawerBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // إرسال حدث بدء الدفع لفيسبوك بيكسل
    if (typeof fbq === 'function') {
      const pkg = packages[selectedPackageId];
      fbq('track', 'InitiateCheckout', {
        value: pkg ? pkg.price : 0,
        currency: 'DZD',
        content_name: pkg ? pkg.title : 'Tivaro Bag'
      });
    }
  }

  function closeOrderDrawer() {
    drawerBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setupDrawerPricing() {
    const pkg = packages[selectedPackageId];
    
    if (drawerProductName) {
      drawerProductName.textContent = pkg.title;
    }
    
    if (drawerQty) {
      let qtyText = `${pkg.bagCount} قطع`;
      if (pkg.bagCount === 1) qtyText = 'قطعة واحدة';
      else if (pkg.bagCount === 2) qtyText = 'قطعتين (2)';
      drawerQty.textContent = qtyText;
    }
    
    const subtotal = pkg.price;
    
    // في حال تفعيل الدفع بالبطاقة والخصم (للتطبيقات المستقبلية)
    if (paymentMethod === 'card') {
      const cardDiscount = Math.round(subtotal * 0.10);
      const total = subtotal - cardDiscount;
      
      drawerDiscountRow.style.display = 'flex';
      drawerDiscountVal.textContent = `- ${cardDiscount} دج`;
      drawerTotal.textContent = `${total} دج`;
      
      document.getElementById('submitBtnText').textContent = 'الدفع بالبطاقة الآن';
    } else {
      drawerDiscountRow.style.display = 'none';
      drawerTotal.textContent = `${subtotal} دج`;
      
      document.getElementById('submitBtnText').textContent = 'تأكيد الطلب - الدفع عند الاستلام';
    }
  }

  function setupDrawerBagConfigs() {
    const pkg = packages[selectedPackageId];
    drawerBagConfigs.innerHTML = ''; // تفريغ الخيارات السابقة
    
    const configTitle = document.createElement('h4');
    configTitle.className = 'bag-config-title';
    configTitle.textContent = 'الألوان المختارة لكل قطعة:';
    drawerBagConfigs.appendChild(configTitle);
    
    // خيارات الألوان المتاحة
    const colorOptions = [
      { value: 'Black', label: 'أسود (Black)' },
      { value: 'Beige', label: 'بيج (Beige)' },
      { value: 'Olive Green', label: 'أخضر زيتوني (Olive Green)' }
    ];

    const colorImages = {
      'Black': 'assets/New folder/black.png',
      'Beige': 'assets/New folder/bag.png',
      'Olive Green': 'assets/New folder/green.png'
    };
    
    // قراءة اختيارات الألوان من الكروت الرئيسية في الصفحة
    const mainSelects = document.querySelectorAll('.package-card select');
    let defaultColors = [];
    mainSelects.forEach(select => {
      defaultColors.push(select.value);
    });
    
    for (let i = 1; i <= pkg.bagCount; i++) {
      const configRow = document.createElement('div');
      configRow.className = 'bag-config-row';
      
      // حاوية لمعاينة الصورة
      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'bag-preview-wrapper';
      
      const previewImg = document.createElement('img');
      previewImg.className = 'bag-preview-img';
      previewImg.alt = `معاينة الحقيبة #${i}`;
      previewWrapper.appendChild(previewImg);
      
      // حاوية لمعلومات ولون الحقيبة
      const configInfo = document.createElement('div');
      configInfo.className = 'bag-config-info';
      
      const configLabel = document.createElement('span');
      configLabel.className = 'bag-config-label';
      configLabel.textContent = `لون الحقيبة #${i}:`;
      
      const selectWrapper = document.createElement('div');
      selectWrapper.className = 'custom-select-wrapper';
      selectWrapper.style.maxWidth = '100%';
      
      const configSelect = document.createElement('select');
      configSelect.className = 'custom-select bag-color-select-input';
      configSelect.name = `bag_color_${i}`;
      
      colorOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        configSelect.appendChild(option);
      });
      
      // تعيين اللون الافتراضي بناءً على اختيار الكروت
      let initialVal = 'Beige';
      if (pkg.bagCount === 1 && defaultColors[0]) {
        initialVal = defaultColors[0];
      } else if (i === 1 && defaultColors[0]) {
        initialVal = defaultColors[0];
      } else if (i === 2 && defaultColors[1]) {
        initialVal = defaultColors[1];
      } else if (i === 3 && defaultColors[2]) {
        initialVal = defaultColors[2];
      }
      
      configSelect.value = initialVal;
      previewImg.src = colorImages[initialVal] || colorImages['Beige'];
      
      selectWrapper.appendChild(configSelect);
      configInfo.appendChild(configLabel);
      configInfo.appendChild(selectWrapper);
      
      configRow.appendChild(previewWrapper);
      configRow.appendChild(configInfo);
      drawerBagConfigs.appendChild(configRow);
      
      // استماع عند تغيير القيمة لتحديث الصورة
      configSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        previewImg.src = colorImages[val] || colorImages['Beige'];
      });
    }
    initCustomDropdowns(drawerBagConfigs);
  }

  // منع إدخال أي حروف في حقل رقم الهاتف
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }

  // --- التحقق من المدخلات وإرسال الطلب ---
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const emirate = document.getElementById('emirate').value;
    
    // التحقق من نوع التوصيل المختار
    const deliveryTypeRadio = document.querySelector('input[name="deliveryType"]:checked');
    const deliveryType = deliveryTypeRadio ? deliveryTypeRadio.value : 'home';
    
    let shippingAddress = '';
    let city = '';
    let address = '';
    let office = '';
    
    if (deliveryType === 'home') {
      city = document.getElementById('city').value;
      address = document.getElementById('address').value.trim();
      
      if (!fullName || !phone || !emirate || !city || !address) {
        alert('يرجى ملئ جميع حقول التوصيل للمنزل.');
        return;
      }
      shippingAddress = `${address}، بلدية ${city}، ولاية ${emirate} (توصيل للمنزل)`;
    } else {
      office = document.getElementById('office').value;
      
      if (!fullName || !phone || !emirate || !office) {
        alert('يرجى اختيار مكتب الشحن.');
        return;
      }
      shippingAddress = `${office}، ولاية ${emirate} (استلام من المكتب)`;
    }
    
    // حالة التحميل والانتظار على زر الإرسال
    const submitBtn = orderForm.querySelector('.submit-btn');
    const submitTextEl = document.getElementById('submitBtnText');
    const originalText = submitTextEl.textContent;
    
    submitBtn.disabled = true;
    submitTextEl.textContent = 'جاري تسجيل طلبك...';
    submitBtn.style.opacity = '0.8';
    
    // محاكاة الاتصال بالسيرفر
    setTimeout(() => {
      submitBtn.disabled = false;
      submitTextEl.textContent = originalText;
      submitBtn.style.opacity = '1';
      
      // جلب الألوان المختارة
      const selectedColors = [];
      const colorSelects = document.querySelectorAll('.bag-color-select-input');
      
      const arabicColors = {
        'Black': 'أسود',
        'Beige': 'بيج',
        'Navy Blue': 'أزرق داكن',
        'Olive Green': 'أخضر زيتوني'
      };
      
      colorSelects.forEach(select => {
        selectedColors.push(arabicColors[select.value] || select.value);
      });
      
      // تفاصيل الطلب
      const orderNum = 'TIV-' + Math.floor(100000 + Math.random() * 900000);
      const pkg = packages[selectedPackageId];
      const subtotal = pkg.price;
      const discount = paymentMethod === 'card' ? Math.round(subtotal * 0.10) : 0;
      const total = subtotal - discount;
      
      // تحديد اسم المنتج بناءً على العرض المختار
      let productName = 'حقيبة يد';
      if (pkg.bagCount === 1) {
        productName = 'حقيبة مع لون';
      } else if (pkg.bagCount === 2) {
        productName = 'حقيبتين';
      } else if (pkg.bagCount === 3) {
        productName = '3 حقائب';
      }

      // تنسيق رقم الهاتف ليحتوي على كود البلد +213
      let formattedPhone = phone;
      const cleanPhone = phone.replace(/\s+/g, '');
      if (!cleanPhone.startsWith('+213') && !cleanPhone.startsWith('213') && !cleanPhone.startsWith('00213')) {
        if (cleanPhone.startsWith('0')) {
          formattedPhone = '+213' + cleanPhone.substring(1);
        } else {
          formattedPhone = '+213' + cleanPhone;
        }
      }
      
      const orderDetails = {
        orderDate: new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' }),
        productName: productName,
        qty: pkg.bagCount,
        colors: selectedColors.join('، '),
        total: `${total} دج`,
        customerName: fullName,
        customerPhone: formattedPhone,
        deliveryType: deliveryType === 'home' ? 'منزل' : 'مكتب',
        wilaya: emirate,
        commune: deliveryType === 'home' ? city : '',
        address: deliveryType === 'home' ? address : office,
        orderNumber: orderNum,
        // للتوافق مع شاشة الفاتورة
        packageName: productName,
        paymentMethod: paymentMethod === 'card' ? 'بطاقة الدفع الإلكتروني' : 'الدفع عند الاستلام (COD)',
        shippingAddress: deliveryType === 'home' ? `${address}، بلدية ${city}، ولاية ${emirate}` : `${office}، ولاية ${emirate}`
      };
      
      // تخزين محلي لأغراض المعاينة والمطابقة
      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
      
      // إرسال الطلب إلى جوجل شيت إذا تم تفعيل الرابط
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
        .catch(err => console.error('فشل إرسال الطلب إلى جوجل شيت:', err));
      }

      // إرسال حدث الشراء لفيسبوك بيكسل
      if (typeof fbq === 'function') {
        fbq('track', 'Purchase', {
          value: total,
          currency: 'DZD',
          content_name: productName,
          content_type: 'product',
          num_items: pkg.bagCount
        });
      }
      
      // إغلاق درج الشحن
      closeOrderDrawer();
      
      // إظهار نافذة تأكيد النجاح
      showSuccessModal(orderDetails);
      
    }, 1500);
  });

  // --- عرض إشعار النجاح الفاخر وصناعة الفرحة ---
  function showSuccessModal(order) {
    document.getElementById('receiptOrderNum').textContent = order.orderNumber;
    document.getElementById('receiptPackage').textContent = order.packageName;
    document.getElementById('receiptColors').textContent = order.colors;
    document.getElementById('receiptPayment').textContent = order.paymentMethod;
    document.getElementById('receiptTotal').textContent = order.total;
    
    successModalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    
  }

  successCloseBtn.addEventListener('click', () => {
    successModalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  });

  // --- Reveal Section Image Slider ---
  const revealTrack = document.getElementById('revealSliderTrack');
  const revealDotsContainer = document.getElementById('revealSliderDots');
  
  if (revealTrack && revealDotsContainer) {
    const slides = revealTrack.querySelectorAll('.reveal-slide');
    const totalRevealSlides = slides.length;
    
    // Create dots dynamically
    revealDotsContainer.innerHTML = '';
    for (let i = 0; i < totalRevealSlides; i++) {
      const dot = document.createElement('span');
      dot.className = i === 0 ? 'reveal-dot active' : 'reveal-dot';
      dot.setAttribute('data-index', i);
      revealDotsContainer.appendChild(dot);
    }
    
    const revealDots = revealDotsContainer.querySelectorAll('.reveal-dot');
    let currentRevealIndex = 0;
    let autoSlideInterval;
    let isRevealDragging = false;
    let startRevealX = 0;
    let currentRevealTranslate = 0;
    let prevRevealTranslate = 0;
    
    const showRevealSlide = (index) => {
      currentRevealIndex = index;
      const containerWidth = revealTrack.parentElement.clientWidth;
      currentRevealTranslate = -currentRevealIndex * containerWidth;
      prevRevealTranslate = currentRevealTranslate;
      revealTrack.style.transform = `translateX(${currentRevealTranslate}px)`;
      
      // Update active dot
      revealDots.forEach((dot, idx) => {
        if (idx === currentRevealIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    };
    
    // Auto slide logic
    const startAutoSlide = () => {
      autoSlideInterval = setInterval(() => {
        let nextIndex = (currentRevealIndex + 1) % totalRevealSlides;
        showRevealSlide(nextIndex);
      }, 4000); // Change slide every 4 seconds
    };
    
    const stopAutoSlide = () => {
      clearInterval(autoSlideInterval);
    };
    
    // Click on dots
    revealDots.forEach(dot => {
      dot.addEventListener('click', () => {
        stopAutoSlide();
        const index = parseInt(dot.getAttribute('data-index'));
        showRevealSlide(index);
        startAutoSlide();
      });
    });

    // أزرار التنقل بالأسهم (Arrow Navigation Buttons)
    const prevRevealBtn = document.getElementById('revealPrevBtn');
    const nextRevealBtn = document.getElementById('revealNextBtn');
    
    if (prevRevealBtn && nextRevealBtn) {
      prevRevealBtn.addEventListener('click', () => {
        stopAutoSlide();
        let prevIndex = currentRevealIndex - 1;
        if (prevIndex < 0) prevIndex = totalRevealSlides - 1;
        showRevealSlide(prevIndex);
        startAutoSlide();
      });
      
      nextRevealBtn.addEventListener('click', () => {
        stopAutoSlide();
        let nextIndex = (currentRevealIndex + 1) % totalRevealSlides;
        showRevealSlide(nextIndex);
        startAutoSlide();
      });
    }

    // Touch & Mouse Drag
    revealTrack.addEventListener('mousedown', dragRevealStart);
    revealTrack.addEventListener('touchstart', dragRevealStart);
    window.addEventListener('mouseup', dragRevealEnd);
    window.addEventListener('touchend', dragRevealEnd);
    revealTrack.addEventListener('mousemove', dragRevealAction);
    revealTrack.addEventListener('touchmove', dragRevealAction);

    function dragRevealStart(e) {
      stopAutoSlide();
      isRevealDragging = true;
      startRevealX = getRevealPositionX(e);
      revealTrack.style.transition = 'none';
    }

    function dragRevealAction(e) {
      if (!isRevealDragging) return;
      const currentX = getRevealPositionX(e);
      const diffX = currentX - startRevealX;
      
      const containerWidth = revealTrack.parentElement.clientWidth;
      currentRevealTranslate = prevRevealTranslate + diffX;
      
      // Boundaries
      const maxScrollable = -(totalRevealSlides - 1) * containerWidth;
      if (currentRevealTranslate > 0) currentRevealTranslate = 0;
      if (currentRevealTranslate < maxScrollable) currentRevealTranslate = maxScrollable;
      
      revealTrack.style.transform = `translateX(${currentRevealTranslate}px)`;
    }

    function dragRevealEnd() {
      if (!isRevealDragging) return;
      isRevealDragging = false;
      revealTrack.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
      
      const containerWidth = revealTrack.parentElement.clientWidth;
      // Calculate closest slide index
      let newIndex = Math.round(Math.abs(currentRevealTranslate) / containerWidth);
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= totalRevealSlides) newIndex = totalRevealSlides - 1;
      
      showRevealSlide(newIndex);
      startAutoSlide();
    }

    function getRevealPositionX(e) {
      return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    // Recalculate layout on window resize
    window.addEventListener('resize', () => {
      showRevealSlide(currentRevealIndex);
    });
    
    // Start interval
    startAutoSlide();
  }

  // --- Dynamic Custom Dropdowns Utility ---
  function initCustomDropdowns(container = document) {
    const wrappers = container.querySelectorAll('.custom-select-wrapper');
    
    wrappers.forEach(wrapper => {
      if (wrapper.querySelector('.custom-select-trigger')) return;
      
      const select = wrapper.querySelector('select');
      if (!select) return;
      
      const options = select.querySelectorAll('option');
      
      // Create custom trigger
      const trigger = document.createElement('div');
      trigger.className = 'custom-select-trigger';
      
      const triggerText = document.createElement('span');
      const activeOption = select.querySelector('option[selected]') || select.querySelector(`option[value="${select.value}"]`) || options[0];
      triggerText.textContent = activeOption ? activeOption.textContent : '';
      
      // Chevron SVG
      const chevronSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevronSvg.setAttribute('viewBox', '0 0 24 24');
      chevronSvg.setAttribute('fill', 'none');
      chevronSvg.setAttribute('stroke', 'currentColor');
      chevronSvg.setAttribute('stroke-width', '2.5');
      chevronSvg.setAttribute('stroke-linecap', 'round');
      chevronSvg.setAttribute('stroke-linejoin', 'round');
      
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '6 9 12 15 18 9');
      chevronSvg.appendChild(polyline);
      
      trigger.appendChild(triggerText);
      trigger.appendChild(chevronSvg);
      
      // Options container
      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'custom-select-options';
      
      options.forEach(opt => {
        const optionEl = document.createElement('div');
        optionEl.className = 'custom-select-option';
        if (opt.value === select.value) {
          optionEl.classList.add('selected');
        }
        optionEl.textContent = opt.textContent;
        optionEl.setAttribute('data-value', opt.value);
        
        optionEl.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = opt.value;
          
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
          
          triggerText.textContent = opt.textContent;
          optionsContainer.querySelectorAll('.custom-select-option').forEach(el => {
            el.classList.remove('selected');
          });
          optionEl.classList.add('selected');
          
          closeAllDropdowns();
        });
        
        optionsContainer.appendChild(optionEl);
      });
      
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = trigger.classList.contains('open');
        closeAllDropdowns();
        
        if (!isOpen) {
          trigger.classList.add('open');
          optionsContainer.classList.add('show');
        }
      });
      
      select.addEventListener('change', () => {
        const activeOpt = select.querySelector(`option[value="${select.value}"]`) || select.querySelector('option[selected]') || options[0];
        if (activeOpt) {
          triggerText.textContent = activeOpt.textContent;
          optionsContainer.querySelectorAll('.custom-select-option').forEach(el => {
            if (el.getAttribute('data-value') === select.value) {
              el.classList.add('selected');
            } else {
              el.classList.remove('selected');
            }
          });
        }
      });
      
      wrapper.appendChild(trigger);
      wrapper.appendChild(optionsContainer);
    });
  }
  
  function closeAllDropdowns() {
    document.querySelectorAll('.custom-select-trigger').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.custom-select-options').forEach(el => el.classList.remove('show'));
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', closeAllDropdowns);

  // Initialize custom dropdowns on load
  initCustomDropdowns();

  // --- منطق تعبئة البلديات والولايات وتوصيل المكتب/المنزل ---
  const hubsByWilaya = {};

  function parseHubsData() {
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

  function initDeliveryFormLogic() {
    parseHubsData();

    const emirateSelect = document.getElementById('emirate');
    const citySelect = document.getElementById('city');
    const officeSelect = document.getElementById('office');
    const cityGroup = document.getElementById('cityGroup');
    const addressGroup = document.getElementById('addressGroup');
    const officeGroup = document.getElementById('officeGroup');
    const addressInput = document.getElementById('address');

    // أزرار راديو اختيار التوصيل
    const deliveryHomeOpt = document.getElementById('deliveryHomeOpt');
    const deliveryOfficeOpt = document.getElementById('deliveryOfficeOpt');

    function setDeliveryType(type) {
      if (type === 'home') {
        deliveryHomeOpt.classList.add('active');
        deliveryOfficeOpt.classList.remove('active');
        document.querySelector('input[name="deliveryType"][value="home"]').checked = true;
        
        cityGroup.style.display = 'block';
        addressGroup.style.display = 'block';
        officeGroup.style.display = 'none';

        citySelect.setAttribute('required', 'required');
        addressInput.setAttribute('required', 'required');
        officeSelect.removeAttribute('required');
      } else {
        deliveryHomeOpt.classList.remove('active');
        deliveryOfficeOpt.classList.add('active');
        document.querySelector('input[name="deliveryType"][value="office"]').checked = true;
        
        cityGroup.style.display = 'none';
        addressGroup.style.display = 'none';
        officeGroup.style.display = 'block';

        citySelect.removeAttribute('required');
        addressInput.removeAttribute('required');
        officeSelect.setAttribute('required', 'required');
      }
    }

    if (deliveryHomeOpt && deliveryOfficeOpt) {
      deliveryHomeOpt.addEventListener('click', () => setDeliveryType('home'));
      deliveryOfficeOpt.addEventListener('click', () => setDeliveryType('office'));
    }

    // ملء الولايات الـ 58
    if (emirateSelect) {
      emirateSelect.innerHTML = '<option value="" disabled selected>اختر الولاية</option>';
      Object.keys(communesParWilaya).forEach(wilaya => {
        const opt = document.createElement('option');
        opt.value = wilaya;
        opt.textContent = wilaya;
        emirateSelect.appendChild(opt);
      });

      // عند تغيير الولاية
      emirateSelect.addEventListener('change', () => {
        const wilayaVal = emirateSelect.value;
        
        // 1. تحديث البلديات
        citySelect.innerHTML = '<option value="" disabled selected>اختر البلدية / الدائرة</option>';
        const communes = communesParWilaya[wilayaVal];
        if (communes && communes.length > 0) {
          communes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            citySelect.appendChild(opt);
          });
          citySelect.disabled = false;
        } else {
          citySelect.disabled = true;
        }

        // 2. تحديث مكاتب الشحن
        officeSelect.innerHTML = '<option value="" disabled selected>اختر مكتب الشحن المتوفر</option>';
        const code = wilayaVal.substring(0, 2);
        const offices = hubsByWilaya[code];
        if (offices && offices.length > 0) {
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
          opt.textContent = 'لا توجد مكاتب متوفرة حالياً في هذه الولاية (يرجى اختيار توصيل للمنزل)';
          officeSelect.appendChild(opt);
          officeSelect.disabled = true;
        }
      });
    }
  }

  // تشغيل منطق التوصيل
  initDeliveryFormLogic();
});

// --- بيانات البلديات ومكاتب الشحن المستوردة ---
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
            "16 - الجزائر": ["الجزائر الوسطى", "القصبة", "حسين داي", "بئر مراد رايس", "باب الواد", "الرويبة", "بوزريعة", "زرالدة", "الدار البيضاء", "بئر خادم", "المحمدية", "الدرارية", "الجزائر الجديدة", "حيدرة", "حجرة حسين", "الواشنة", "الأبيار"],
            "17 - الجلفة": ["الجلفة", "عين وسارة", "دار الشيوخ", "الشارف", "حد الصحاري", "عين الإبل", "مسعد", "زعفران", "القديد", "سيدي لعجال", "تعظميت", "فيض البطمة"],
            "18 - جيجل": ["جيجل", "الميلية", "الطاهير", "القنار", "سيدي معروف", "الشقفة", "غبالة", "بوراوي بلهادف", "العوانة", "أم عبود", "زيامة منصورية", "السطارة"],
            "19 - سطيف": ["سطيف", "عين أرنات", "عين ولمان", "عين آزال", "بئر العرش", "بوعنداس", "جميلة", "قنزات", "صالح باي", "القلتة الزرقاء", "حمام قرقور", "معاوية"],
            "20 - سعيدة": ["سعيدة", "دوي ثايل", "أولاد إبراهيم", "سيدي عمر", "سيدي أحمد", "عين الحجر", "البيض", "يوب", "حدادة", "مشيرة"],
            "21 - سكيكدة": ["سكيكدة", "الحروش", "ابن بسلة", "مشوار", "سيدي عبد العزيز", "العلمة", "برحال", "الطرشان"],
            "22 - سيدي بلعباس": ["سيدي بلعباس", "تسالة", "مرين", "رأس الماء", "سيدي علي بوسيدي", "تلمون", "عين أدن", "مزاورو", "سيدي لحسن", "بطيوة", "سيدي إبراهيم", "حمام ريغة"],
            "23 - عنابة": ["عنابة", "برحال", "الشرفة", "العنصر", "وادي العنب", "البوني", "الحجار", "سرايدي", "شطايبي", "تريعات"],
            "24 - قالمة": ["قالمة", "هيليوبوليس", "وادي الزناتي", "بوشقوف", "عين بن بيضاء", "بومهرة", "حمام دباغ", "حمام النبايل", "لخزارة", "وادي فراغة"],
            "25 - قسنطينة": ["قسنطينة", "الخروب", "زيغود يوسف", "عين سمارة", "حامة بوزيان", "درايس", "ابن زياد", "ابن باديس", "مليلية", "مروانة"],
            "26 - المدية": ["المدية", "وزرة", "العزيزية", "الشيخ", "العيساوية", "تمسقيدة", "سيدي نعمان", "العمارية", "الكاف", "بوعيش", "أولاد عنتر", "أولاد هلال"],
            "27 - مستغانم": ["مستغانم", "حجاج", "خير الدين", "مزغران", "عين تادلس", "سيدي علي", "بوقيراط", "الصفصاف", "عشعاشة", "خضرة", "ستيدية"],
            "28 - المسيلة": ["المسيلة", "بوسعادة", "أولاد دراج", "سيدي عامر", "عين الحجل", "عين الملح", "حمام الضلعة", "الهامل", "مقرة", "أولاد ماضي", "سليم", "الخبانة"],
            "29 - معسكر": ["معسكر", "سيق", "غريس", "وادي الأبطال", "زهانة", "ماوسطة", "مقطع دوز", "عين فراح", "البرج", "خليل", "المامونية", "قرجوم"],
            "30 - ورقلة": ["ورقلة", "حاسي مسعود", "انقوسة", "الطيبات", "سيدي خويلد", "حاسي بن عبد الله", "العقلة", "بئر بير", "الرويسات", "النزلة"],
            "31 - وهران": ["وهران", "بئر الجير", "الأبيار", "سانيا", "عين الترك", "قديل", "بطيوة", "أرزيو", "حاسي بونيف", "الكرمة", "بوسفر", "بوتليليس", "سيدي الشحمي"],
            "32 - البيض": ["البيض", "بوقطب", "الغاسول", "الأبيض", "بريزينة", "الشقيق", "الخيثر", "كراكدة", "رأس الماء", "بوسمغون"],
            "33 - إليزي": ["إليزي", "جانت", "برج عمر إدريس", "إن أميناس"],
            "34 - برج بوعريريج": ["برج بوعريريج", "رأس الوادي", "برج زمورة", "الحمادية", "الميلية", "عين تاغروت", "غيلاسة", "المعاصم", "مجانة", "المنصورة"],
            "35 - بومرداس": ["بومرداس", "بودواو", "بغلية", "الثنية", "دلس", "زموري", "الناصرية", "يسر", "أوقاس", "خميس الخشنة"],
            "36 - الطارف": ["الطارف", "بن مهيدي", "البسباس", "بوحجار", "الطارف", "العيون", "زريزر", "الشط", "عين العسل", "الذرعان"],
            "37 - تندوف": ["تندوف", "أوم العير"],
            "38 - تيسمسيلت": ["تيسمسيلت", "برج بونعامة", "لرجام", "ثنية الحد", "الأزهرية", "عميرة", "بني شعيب", "سيدي بوتشنت", "سيدي عابد", "تملاحت"],
            "39 - الوادي": ["الوادي", "البياضة", "رباح", "الرقيبة", "حساني عبد الكريم", "قمار", "المقرن", "اميه وانسة", "سطيل", "تغزوت"],
            "40 - خنشلة": ["خنشلة", "قايس", "بغاي", "شلية", "الحامة", "عين الطويلة", "يابوس", "الولجة", "المحمل", "ام العظائم"],
            "41 - سوق أهراس": ["سوق أهراس", "سدراتة", "المراهنة", "تاورة", "الزوابي", "الحدادة", "الخضارة", "أولاد إدريس", "الزعرور", "الطاية"],
            "42 - تيبازة": ["تيبازة", "شرشال", "ددامس", "فوكة", "بوفاريك", "القليعة", "حجوط", "سيدي راشد", "عين تاقورايت", "مسلمون", "سيدي سميان", "بوهارون", "خميستي"],
            "43 - ميلة": ["ميلة", "فرجيوة", "شلغوم العيد", "تاجنانت", "عين البيضاء", "سيدي مروان", "التلاغمة", "ترعي باينان", "أولاد اخلوف", "الرواشد"],
            "44 - عين الدفلى": ["عين الدفلى", "مليانة", "بومدفع", "العامرة", "برج الأمير خالد", "جندل", "العبادية", "عين لشياخ", "الحسينية", "روينة"],
            "45 - النعامة": ["النعامة", "مغرار", "عين الصفراء", "عين بن خليل", "مكمن بن عمار", "الصفصاف", "المشرية", "سفيسيفة", "عسلة"],
            "46 - عين تموشنت": ["عين تموشنت", "حمام بوحجر", "بني صاف", "العين", "الأمير عبد القادر", "عين الأربعاء", "الأمير", "سيدي بن عدة", "حاسي الغلة", "بوجبهور البرج"],
            "47 - غرداية": ["غرداية", "متليلي", "المنيعة", "ضاية بن ضحوة", "بونورة", "القرارة", "بريان", "أقلي", "حاسي القارة", "زلفانة"],
            "48 - غليزان": ["غليزان", "وادي رهيو", "الحمادنة", "عمي موسى", "عين طارق", "القلعة", "منداس", "وزرة", "سيدي سعادة", "بني درقن"],
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
