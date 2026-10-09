using System.Windows;
using QuestPDF.Infrastructure;

namespace Dubsar
{
    /// <summary>
    /// نقطة بداية تشغيل تطبيق WPF
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // تفعيل ترخيص QuestPDF المجاني للعمل أوفلاين بنسبة 100%
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        }
    }
}
