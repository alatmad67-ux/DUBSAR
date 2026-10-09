using System;
using QuestPDF.Infrastructure;

namespace Dubsar
{
    public static class Program
    {
        [STAThread]
        public static void Main(string[] args)
        {
            // تفعيل ترخيص QuestPDF المجاني للعمل أوفلاين بنسبة 100%
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

            Console.WriteLine("تم تفعيل ترخيص QuestPDF بنجاح.");
            
            // نقطة انطلاق التطبيق الخاصة بك (مثل تشغيل شاشة المبيعات أو النافذة الرئيسية)
            // System.Windows.Forms.Application.Run(new MainForm());
        }
    }
}
