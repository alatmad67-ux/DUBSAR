using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace Dubsar.Services.Printing
{
    /// <summary>
    /// خدمة الطباعة المركزية وإدارة مستندات QuestPDF
    /// </summary>
    public static class InvoicePrintingService
    {
        private static bool _isInitialized = false;

        /// <summary>
        /// تفعيل ترخيص QuestPDF المجاني للشركات والأنشطة التجارية
        /// يتم استدعاؤها تلقائياً أو في بداية تشغيل التطبيق (مثل Program.cs أو App.xaml.cs)
        /// </summary>
        public static void Initialize()
        {
            if (_isInitialized) return;

            // تفعيل رخصة المجتمع المجانية (Offline Community License)
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
            _isInitialized = true;
        }

        #region دالة التحويل والربط (Mapping Helper)
        /// <summary>
        /// تحويل بيانات الفاتورة من كائن قاعدة البيانات / الشاشة إلى نموذج الطباعة
        /// </summary>
        /// <param name="invoiceData">كائن الفاتورة من نظام المبيعات</param>
        /// <param name="itemsData">قائمة المواد من الفاتورة</param>
        /// <param name="customerData">بيانات العميل (اختياري)</param>
        /// <returns>نموذج طباعة مهيأ بالكامل</returns>
        public static InvoicePrintDataModel MapToPrintModel(
            dynamic invoiceData, 
            IEnumerable<dynamic> itemsData, 
            dynamic? customerData = null)
        {
            var model = new InvoicePrintDataModel
            {
                InvoiceNumber = invoiceData?.InvoiceNumber?.ToString() ?? invoiceData?.OrderNumber?.ToString() ?? "INV-0001",
                IssueDate = invoiceData?.CreatedAt is DateTime dt ? dt : DateTime.Now,
                PaymentMethod = invoiceData?.PaymentMethod?.ToString() ?? "نقدي",
                CustomerName = customerData?.Name?.ToString() ?? invoiceData?.CustomerName?.ToString() ?? "زبون نقدي عام",
                CustomerPhone = customerData?.Phone?.ToString() ?? invoiceData?.CustomerPhone?.ToString() ?? "",
                CustomerAddress = customerData?.Address?.ToString() ?? invoiceData?.CustomerAddress?.ToString() ?? "",
                Notes = invoiceData?.Notes?.ToString() ?? "البضاعة المباعة ترد أو تستبدل خلال 3 أيام شرط سلامة التغليف.",
                TotalDiscount = Convert.ToDecimal(invoiceData?.Discount ?? invoiceData?.TotalDiscount ?? 0),
                PreviousBalance = Convert.ToDecimal(invoiceData?.PreviousBalance ?? 0),
                PaidAmount = Convert.ToDecimal(invoiceData?.PaidAmount ?? 0)
            };

            int index = 1;
            decimal itemsSum = 0;

            foreach (var item in itemsData)
            {
                decimal qty = Convert.ToDecimal(item?.Quantity ?? 1);
                decimal price = Convert.ToDecimal(item?.Price ?? item?.UnitPrice ?? 0);
                decimal discount = Convert.ToDecimal(item?.Discount ?? 0);

                var printItem = new InvoiceItemModel
                {
                    Index = index++,
                    Barcode = item?.Barcode?.ToString() ?? "",
                    Name = item?.Name?.ToString() ?? item?.ProductName?.ToString() ?? "مادة غير محددة",
                    Unit = item?.Unit?.ToString() ?? "قطعة",
                    Quantity = qty,
                    UnitPrice = price,
                    Discount = discount
                };

                itemsSum += printItem.TotalPrice;
                model.Items.Add(printItem);
            }

            model.TotalItemsAmount = itemsSum + model.TotalDiscount;
            return model;
        }
        #endregion

        #region دوال توليد الـ PDF والمعاينة والطباعة المباشرة
        /// <summary>
        /// توليد ملف PDF وحفظه في مسار محدد
        /// </summary>
        public static string GeneratePdfFile(InvoicePrintDataModel model, InvoicePrintSettings settings, string? destinationPath = null)
        {
            Initialize();

            string outputPath = destinationPath ?? Path.Combine(
                Path.GetTempPath(), 
                $"Dubsar_Invoice_{model.InvoiceNumber}_{DateTime.Now:yyyyMMddHHmmss}.pdf"
            );

            var document = new InvoiceDocument(model, settings);
            document.GeneratePdf(outputPath);

            return outputPath;
        }

        /// <summary>
        /// عرض الفاتورة للمعاينة المباشرة في عارض الـ PDF الافتراضي للنظام
        /// </summary>
        public static async Task PreviewInvoiceAsync(InvoicePrintDataModel model, InvoicePrintSettings settings)
        {
            await Task.Run(() =>
            {
                string pdfPath = GeneratePdfFile(model, settings);
                
                // فتح ملف الـ PDF فوراً في نظام ويندوز للمعاينة
                var psi = new ProcessStartInfo
                {
                    FileName = pdfPath,
                    UseShellExecute = true
                };
                Process.Start(psi);
            });
        }

        /// <summary>
        /// إرسال الفاتورة مباشرة للطباعة عبر الطابعة الافتراضية
        /// </summary>
        public static async Task PrintInvoiceDirectAsync(InvoicePrintDataModel model, InvoicePrintSettings settings)
        {
            await Task.Run(() =>
            {
                string pdfPath = GeneratePdfFile(model, settings);
                
                // أمر طباعة صامت عبر برنامج تشغيل الـ PDF الافتراضي
                var psi = new ProcessStartInfo
                {
                    FileName = pdfPath,
                    Verb = "print",
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    UseShellExecute = true
                };
                Process.Start(psi);
            });
        }
        #endregion
    }
}
