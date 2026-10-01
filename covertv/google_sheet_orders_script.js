/**
 * ====================================================================
 * سكريبت استقبال وتخزين طلبات صفحة الهبوط (Google Apps Script)
 * COD Landing Page Orders Webhook Receiver
 * ====================================================================
 * 
 * طريقة التثبيت في 30 ثانية:
 * 1. افتح جدول Google Sheet جديد في حسابك.
 * 2. من القائمة العلوية اضغط: Extensions (الإضافات) -> Apps Script.
 * 3. احذف أي كود والصق هذا الكود بالكامل واضغط زر الحفظ (Save 💾).
 * 4. اضغط على Deploy (نشر) باللون الأزرق بالأعلى -> New deployment (نشر جديد).
 * 5. اضغط على رمز الترس ⚙️ بجانب "Select type" واختر "Web app" (تطبيق ويب).
 * 6. في خانة "Execute as": اختر "Me" (حسابك).
 * 7. في خانة "Who has access": اختر "Anyone" (أي شخص / الجميع) - ضروري لكي تستقبل الطلبات!
 * 8. اضغط Deploy ووافق على الصلاحيات، ثم انسخ رابط "Web app URL" وضعه في محرر صفحة الهبوط!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // إنشاء عناوين الأعمدة تلقائياً في السطر الأول إذا كان الجدول فارغاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "تاريخ وتوقيت الطلب",
        "اسم العميل",
        "رقم الهاتف",
        "الولاية",
        "البلدية / مكتب الاستلام",
        "نوع التوصيل",
        "اسم المنتج",
        "العرض المختار",
        "الكمية",
        "السعر الإجمالي",
        "ملاحظات العميل",
        "معرف الطلب"
      ]);
      
      // تنسيق سطر العناوين
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setBackground("#0F172A");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var customer = data.customerData || data;
    var now = new Date();
    var formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+1", "yyyy-MM-dd HH:mm:ss");

    var fullName = customer.customer_name || customer.fullName || customer.name || data.customer_name || data.fullName || data.name || "";
    var phone = customer.phone || customer.tel || customer.field_tel || data.phone || "";
    var wilaya = customer.home_wilaya || customer.desk_wilaya || customer.wilaya || customer.homeWilaya || customer.deskWilaya || data.wilaya || data.home_wilaya || data.desk_wilaya || "";
    var communeOrHub = customer.home_commune || customer.desk_hub || customer.commune || customer.address || customer.homeCommune || customer.deskHub || data.commune || data.address || data.home_commune || data.desk_hub || "";
    var detailedAddress = customer.home_address || customer.address || data.home_address || data.address || "";
    var locationDesc = communeOrHub;
    if (detailedAddress && detailedAddress !== communeOrHub) {
      locationDesc = communeOrHub ? (communeOrHub + " - " + detailedAddress) : detailedAddress;
    }
    var deliveryMode = (data.deliveryType === "desk" || customer.deliveryType === "desk" || data.delivery_type === "desk" || customer.delivery_type === "desk") ? "مكتب (Stop Desk)" : "توصيل للمنزل";
    var productTitle = data.productTitle || customer.productTitle || "";
    var offerTitle = data.offerTitle || customer.offerTitle || customer.selectedOfferTitle || "عرض أساسي";
    var quantity = data.quantity || customer.quantity || customer.field_number_qty || 1;
    var totalPrice = data.totalPrice || customer.totalPrice || "";
    var notes = customer.notes || customer.field_textarea_notes || "";
    var orderId = data.id || ("ord_" + now.getTime());

    // إضافة سطر الطلب
    sheet.appendRow([
      formattedDate,
      fullName,
      "'" + phone, // علامة ' لمنع حذف الصفر في بداية رقم الهاتف
      wilaya,
      locationDesc,
      deliveryMode,
      productTitle,
      offerTitle,
      quantity,
      totalPrice,
      notes,
      orderId
    ]);

    // محاذاة البيانات في المنتصف
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 12).setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", orderId: orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Google Sheets Webhook جاهز ويستقبل الطلبات بنجاح ✅");
}
