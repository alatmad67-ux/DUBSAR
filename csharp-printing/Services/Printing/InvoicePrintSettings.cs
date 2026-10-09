using System;

namespace Dubsar.Services.Printing
{
    /// <summary>
    /// إعدادات تخصيص طباعة الفاتورة A4 القابلة للتحكم والتخزين من إعدادات المستخدم محلياً (100% Offline)
    /// </summary>
    public class InvoicePrintSettings
    {
        #region الهيدر والشعار (Header Image & Brand)
        /// <summary>
        /// مسار صورة الهيدر/اللوجو التي يرفعها صاحب النشاط من جهاز الكمبيوتر (مثال: C:\DUBSAR\Header.jpg).
        /// إذا كان المسار يحتوي على صورة موجودة على الجهاز يتم عرضها في أعلى الفاتورة بالكامل بعرض الصفحة.
        /// إذا لم تكن موجودة، يتم عرض الهيدر الافتراضي (اسم الشركة، الهاتف، والعنوان).
        /// </summary>
        public string? HeaderImagePath { get; set; }

        public string CompanyName { get; set; } = "منظومة دوبسار للمبيعات";
        public string CompanyPhone { get; set; } = "07858833838";
        public string CompanyAddress { get; set; } = "العراق - كربلاء / بغداد";
        public string CommercialRegister { get; set; } = "سجل تجاري: 49012";
        #endregion

        #region التحكم بالأعمدة (Dynamic Columns Visibility)
        /// <summary>
        /// إظهار أو إخفاء عمود التسلسل (#)
        /// </summary>
        public bool ShowItemIndex { get; set; } = true;

        /// <summary>
        /// إظهار أو إخفاء عمود الباركود
        /// </summary>
        public bool ShowBarcode { get; set; } = false;

        /// <summary>
        /// إظهار أو إخفاء عمود الوحدة (قطعة، كرتون، كيس...)
        /// </summary>
        public bool ShowUnit { get; set; } = true;

        /// <summary>
        /// إظهار أو إخفاء عمود الخصم
        /// </summary>
        public bool ShowDiscount { get; set; } = true;
        #endregion

        #region الملاحظات والتواقيع (Notes & Signatures)
        /// <summary>
        /// إظهار أو إخفاء نص الملاحظات أسفل الفاتورة
        /// </summary>
        public bool ShowNotes { get; set; } = true;

        /// <summary>
        /// إظهار حقل توقيع واسم منظم الفاتورة / المحاسب
        /// </summary>
        public bool ShowOrganizerName { get; set; } = true;

        /// <summary>
        /// إظهار حقل توقيع واسم المجهز / الإدارة
        /// </summary>
        public bool ShowSupplierName { get; set; } = true;

        /// <summary>
        /// إظهار حقل توقيع المستلم / العميل
        /// </summary>
        public bool ShowCustomerSignature { get; set; } = true;

        public string OrganizerTitle { get; set; } = "منظّم الفاتورة";
        public string SupplierTitle { get; set; } = "الختم والتوقيع المعتمد";
        #endregion

        #region الخط والمظهر العام
        /// <summary>
        /// اسم الخط العربي المثبت محلياً على نظام ويندوز بدون إنترنت
        /// </summary>
        public string FontFamily { get; set; } = "Segoe UI";

        public string PrimaryColorHex { get; set; } = "#1E293B"; // Slate-800
    }
}
