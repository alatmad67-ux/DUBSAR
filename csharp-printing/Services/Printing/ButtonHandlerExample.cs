using System;
using System.IO;
using System.Text.Json;
using System.Windows;
using QuestPDF.Infrastructure;

namespace Dubsar.Services.Printing
{
    /// <summary>
    /// أمثلة لكيفية ربط خدمة الطباعة بأزرار الواجهة ونقطة بداية المشروع (Program.cs / App.xaml.cs / btnPrint_Click)
    /// </summary>
    public static class UsageExamples
    {
        /*
        // =========================================================================
        // 1. في نقطة بداية المشروع (Program.cs أو App.xaml.cs):
        // =========================================================================
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // تفعيل ترخيص QuestPDF المجاني للشركات والأنشطة الصغيرة
            QuestPDF.Settings.License = LicenseType.Community;
        }
        */

        // =========================================================================
        // 2. كود حدث زر الطباعة في واجهة المبيعات أو شاشة الفاتورة (btnPrint_Click):
        // =========================================================================
        public static async void OnPrintInvoiceButtonClick(object sender, dynamic currentSalesInvoice)
        {
            try
            {
                // أ. قراءة إعدادات الطباعة الحالية للمستخدم (أو استخدام الإعدادات الافتراضية)
                var settings = LoadUserSettings();

                // ب. استخدام دالة التحويل (Mapping) لتحويل كائن الفاتورة من الشاشة / قاعدة البيانات
                var printData = InvoicePrintingService.MapToPrintModel(
                    invoiceData: currentSalesInvoice,
                    itemsData: currentSalesInvoice.Items,
                    customerData: currentSalesInvoice.Customer
                );

                // ج. استدعاء خدمة الطباعة للمعاينة أو الطباعة المباشرة:
                
                // للمعاينة كـ PDF:
                await InvoicePrintingService.PreviewInvoiceAsync(printData, settings);

                // أو للطباعة المباشرة بدون نافذة معاينة:
                // await InvoicePrintingService.PrintInvoiceDirectAsync(printData, settings);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"حدث خطأ أثناء إعداد أو طباعة الفاتورة:\n{ex.Message}", "خطأ في الطباعة", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        /// <summary>
        /// تحميل إعدادات الطباعة من ملف JSON محلي على الجهاز
        /// </summary>
        public static InvoicePrintSettings LoadUserSettings()
        {
            string settingsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "print_settings.json");
            
            if (File.Exists(settingsPath))
            {
                try
                {
                    string json = File.ReadAllText(settingsPath);
                    return JsonSerializer.Deserialize<InvoicePrintSettings>(json) ?? new InvoicePrintSettings();
                }
                catch { }
            }

            // الإعدادات الافتراضية في حال عدم وجود ملف الإعدادات بعد
            return new InvoicePrintSettings
            {
                HeaderImagePath = @"C:\Dubsar\Header.jpg", // المسار المخصص إن وجد
                ShowItemIndex = true,
                ShowBarcode = false,
                ShowUnit = true,
                ShowDiscount = true,
                ShowNotes = true,
                ShowOrganizerName = true,
                ShowSupplierName = true,
                FontFamily = "Segoe UI"
            };
        }

        /// <summary>
        /// حفظ إعدادات الطباعة عند قيام المستخدم بتعديلها من شاشة الإعدادات
        /// </summary>
        public static void SaveUserSettings(InvoicePrintSettings settings)
        {
            string settingsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "print_settings.json");
            string json = JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(settingsPath, json);
        }
    }
}
