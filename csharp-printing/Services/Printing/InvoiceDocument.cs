using System;
using System.IO;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Dubsar.Services.Printing
{
    /// <summary>
    /// قالب الفاتورة الرسمي A4 باستخدام مكتبة QuestPDF
    /// يدعم الهيدر المخصص، الأعمدة الديناميكية، الخطوط العربية بدون إنترنت، واتجاه RTL
    /// </summary>
    public class InvoiceDocument : IDocument
    {
        private readonly InvoicePrintDataModel _model;
        private readonly InvoicePrintSettings _settings;

        public InvoiceDocument(InvoicePrintDataModel model, InvoicePrintSettings settings)
        {
            _model = model;
            _settings = settings;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.2f, Unit.Centimetre);
                page.PageColor(Colors.White);

                // ضبط الخط العربي الافتراضي محلياً بدون إنترنت
                page.DefaultTextStyle(x => x
                    .FontFamily(_settings.FontFamily)
                    .FontSize(9.5f)
                    .FontColor(Colors.Grey.Darken4));

                page.Header().Element(ComposeHeader);
                page.Content().Element(ComposeContent);
                page.Footer().Element(ComposeFooter);
            });
        }

        #region الهيدر الديناميكي
        private void ComposeHeader(IContainer container)
        {
            container.Column(col =>
            {
                // إذا كان مسار الصورة موجوداً على الجهاز، يتم عرض الصورة في أعلى الفاتورة بالكامل
                bool hasCustomImage = !string.IsNullOrWhiteSpace(_settings.HeaderImagePath)
                                      && File.Exists(_settings.HeaderImagePath);

                if (hasCustomImage)
                {
                    col.Item().PaddingBottom(10).Image(_settings.HeaderImagePath!).FitWidth();
                }
                else
                {
                    // الهيدر الافتراضي النصي
                    col.Item().BorderBottom(1.5f).BorderColor(_settings.PrimaryColorHex).PaddingBottom(8).Row(row =>
                    {
                        row.RelativeItem(3).Column(c =>
                        {
                            c.Item().Text(_settings.CompanyName)
                                .Bold().FontSize(16).FontColor(_settings.PrimaryColorHex);
                            c.Item().Text($"هاتف: {_settings.CompanyPhone} • العنوان: {_settings.CompanyAddress}")
                                .FontSize(9).FontColor(Colors.Grey.Darken2);
                            c.Item().Text(_settings.CommercialRegister)
                                .FontSize(8.5f).FontColor(Colors.Grey.Darken1);
                        });

                        row.RelativeItem(2).AlignLeft().Column(c =>
                        {
                            c.Item().AlignLeft().Text("فاتورة مبيعات")
                                .Bold().FontSize(18).FontColor(_settings.PrimaryColorHex);
                            c.Item().AlignLeft().Text($"رقم الفاتورة: {_model.InvoiceNumber}")
                                .Bold().FontSize(10).FontColor(Colors.Blue.Darken2);
                            c.Item().AlignLeft().Text($"التاريخ: {_model.IssueDate:yyyy/MM/dd HH:mm}")
                                .FontSize(8.5f).FontColor(Colors.Grey.Darken2);
                        });
                    });
                }

                // بطاقة بيانات العميل والفاتورة
                col.Item().PaddingTop(8).PaddingBottom(8).Border(1).BorderColor(Colors.Grey.Lighten2)
                    .Background(Colors.Grey.Lighten4).Padding(6).Row(info =>
                {
                    info.RelativeItem().Column(c =>
                    {
                        c.Item().Text(t =>
                        {
                            t.Span("العميل / السيد: ").Bold();
                            t.Span(string.IsNullOrWhiteSpace(_model.CustomerName) ? "زبون نقدي عام" : _model.CustomerName);
                        });
                        if (!string.IsNullOrWhiteSpace(_model.CustomerPhone))
                        {
                            c.Item().Text(t =>
                            {
                                t.Span("رقم الهاتف: ").Bold();
                                t.Span(_model.CustomerPhone);
                            });
                        }
                    });

                    info.RelativeItem().Column(c =>
                    {
                        c.Item().Text(t =>
                        {
                            t.Span("طريقة الدفع: ").Bold();
                            t.Span(_model.PaymentMethod);
                        });
                        if (!string.IsNullOrWhiteSpace(_model.CustomerAddress))
                        {
                            c.Item().Text(t =>
                            {
                                t.Span("العنوان: ").Bold();
                                t.Span(_model.CustomerAddress);
                            });
                        }
                    });

                    if (hasCustomImage)
                    {
                        info.ConstantItem(120).AlignLeft().Column(c =>
                        {
                            c.Item().AlignLeft().Text($"رقم الفاتورة: {_model.InvoiceNumber}").Bold();
                            c.Item().AlignLeft().Text($"{_model.IssueDate:yyyy/MM/dd}");
                        });
                    }
                });
            });
        }
        #endregion

        #region محتوى الفاتورة والجدول الديناميكي
        private void ComposeContent(IContainer container)
        {
            container.PaddingTop(4).Column(col =>
            {
                // جدول المواد بالأعمدة الديناميكية
                col.Item().Element(ComposeTable);

                // ملخص الحسابات الإجمالية
                col.Item().PaddingTop(8).Element(ComposeFinancialSummary);

                // الملاحظات
                if (_settings.ShowNotes && !string.IsNullOrWhiteSpace(_model.Notes))
                {
                    col.Item().PaddingTop(8).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Column(c =>
                    {
                        c.Item().Text("ملاحظات وشروط:").Bold().FontSize(8.5f);
                        c.Item().Text(_model.Notes).FontSize(8).FontColor(Colors.Grey.Darken2);
                    });
                }

                // التواقيع
                col.Item().PaddingTop(12).Element(ComposeSignatures);
            });
        }

        private void ComposeTable(IContainer container)
        {
            container.Table(table =>
            {
                // 1. تعريف الأعمدة ديناميكياً لتوزيع المساحة تلقائياً لتملأ عرض الجدول بالتساوي
                table.ColumnsDefinition(columns =>
                {
                    if (_settings.ShowItemIndex)
                        columns.ConstantColumn(25); // تسلسل

                    if (_settings.ShowBarcode)
                        columns.ConstantColumn(75); // الباركود

                    // عمود اسم المادة يأخذ كل المساحة المتبقية تلقائياً
                    columns.RelativeColumn(4);

                    if (_settings.ShowUnit)
                        columns.ConstantColumn(45); // الوحدة

                    columns.ConstantColumn(45); // الكمية
                    columns.ConstantColumn(65); // السعر

                    if (_settings.ShowDiscount)
                        columns.ConstantColumn(50); // الخصم

                    columns.ConstantColumn(75); // المجموع
                });

                // 2. ترويسة الجدول الشرطية
                table.Header(header =>
                {
                    if (_settings.ShowItemIndex)
                        header.Cell().Element(HeaderCellStyle).AlignCenter().Text("ت");

                    if (_settings.ShowBarcode)
                        header.Cell().Element(HeaderCellStyle).AlignCenter().Text("الباركود");

                    header.Cell().Element(HeaderCellStyle).AlignRight().Text("المادة / البيان");

                    if (_settings.ShowUnit)
                        header.Cell().Element(HeaderCellStyle).AlignCenter().Text("الوحدة");

                    header.Cell().Element(HeaderCellStyle).AlignCenter().Text("الكمية");
                    header.Cell().Element(HeaderCellStyle).AlignCenter().Text("السعر");

                    if (_settings.ShowDiscount)
                        header.Cell().Element(HeaderCellStyle).AlignCenter().Text("الخصم");

                    header.Cell().Element(HeaderCellStyle).AlignCenter().Text("المجموع");
                });

                // 3. صفوف المواد الشرطية
                int rowIndex = 1;
                foreach (var item in _model.Items)
                {
                    bool isEven = rowIndex % 2 == 0;

                    if (_settings.ShowItemIndex)
                        table.Cell().Element(c => RowCellStyle(c, isEven)).AlignCenter().Text(rowIndex.ToString());

                    if (_settings.ShowBarcode)
                        table.Cell().Element(c => RowCellStyle(c, isEven)).AlignCenter().Text(item.Barcode);

                    table.Cell().Element(c => RowCellStyle(c, isEven)).AlignRight().Text(item.Name).Bold();

                    if (_settings.ShowUnit)
                        table.Cell().Element(c => RowCellStyle(c, isEven)).AlignCenter().Text(item.Unit);

                    table.Cell().Element(c => RowCellStyle(c, isEven)).AlignCenter().Text($"{item.Quantity:N0}");
                    table.Cell().Element(c => RowCellStyle(c, isEven)).AlignCenter().Text($"{item.UnitPrice:N0}");

                    if (_settings.ShowDiscount)
                        table.Cell().Element(c => RowCellStyle(c, isEven)).AlignCenter().Text($"{item.Discount:N0}");

                    table.Cell().Element(c => RowCellStyle(c, isEven)).AlignCenter().Text($"{item.TotalPrice:N0}").Bold();

                    rowIndex++;
                }
            });
        }

        private static IContainer HeaderCellStyle(IContainer container)
        {
            return container
                .Background("#1E293B")
                .Border(0.5f)
                .BorderColor(Colors.Grey.Darken2)
                .PaddingVertical(4)
                .PaddingHorizontal(3)
                .DefaultTextStyle(x => x.Bold().FontSize(8.5f).FontColor(Colors.White));
        }

        private static IContainer RowCellStyle(IContainer container, bool isEven)
        {
            return container
                .Background(isEven ? Colors.Grey.Lighten5 : Colors.White)
                .BorderBottom(0.5f)
                .BorderColor(Colors.Grey.Lighten3)
                .PaddingVertical(4)
                .PaddingHorizontal(3)
                .DefaultTextStyle(x => x.FontSize(8.5f));
        }
        #endregion

        #region الملخص المالي والتواقيع
        private void ComposeFinancialSummary(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text($"عدد المواد: {_model.Items.Count} مادة").FontSize(8.5f).FontColor(Colors.Grey.Darken1);
                });

                row.ConstantItem(230).Border(1).BorderColor(Colors.Grey.Lighten2).Column(col =>
                {
                    SummaryRow(col, "مجموع المواد:", $"{_model.TotalItemsAmount:N0} د.ع");

                    if (_model.TotalDiscount > 0)
                        SummaryRow(col, "الخصم الإجمالي:", $"{_model.TotalDiscount:N0} د.ع", Colors.Red.Darken2);

                    SummaryRow(col, "صافي الفاتورة:", $"{_model.NetTotal:N0} د.ع", isBold: true);

                    if (_model.PreviousBalance != 0)
                        SummaryRow(col, "حساب سابق:", $"{_model.PreviousBalance:N0} د.ع");

                    SummaryRow(col, "الواصل / المدفوع:", $"{_model.PaidAmount:N0} د.ع", Colors.Green.Darken2);
                    SummaryRow(col, "المتبقي / الرصيد:", $"{_model.RemainingBalance:N0} د.ع", Colors.Red.Darken3, isBold: true, isHighlight: true);
                });
            });
        }

        private static void SummaryRow(ColumnDescriptor col, string label, string value, string? valueColor = null, bool isBold = false, bool isHighlight = false)
        {
            col.Item()
                .Background(isHighlight ? Colors.Grey.Lighten4 : Colors.White)
                .BorderBottom(0.5f)
                .BorderColor(Colors.Grey.Lighten3)
                .PaddingVertical(2.5f)
                .PaddingHorizontal(6)
                .Row(r =>
                {
                    r.RelativeItem().AlignRight().Text(label).FontSize(8.5f).Bold(isBold);
                    r.RelativeItem().AlignLeft().Text(value).FontSize(8.5f).Bold(isBold).FontColor(valueColor ?? Colors.Grey.Darken4);
                });
        }

        private void ComposeSignatures(IContainer container)
        {
            container.Row(row =>
            {
                if (_settings.ShowOrganizerName)
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().AlignCenter().Text(_settings.OrganizerTitle).Bold().FontSize(8.5f);
                        c.Item().PaddingTop(25).AlignCenter().Text("..................................").FontColor(Colors.Grey.Lighten1);
                    });
                }

                if (_settings.ShowCustomerSignature)
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().AlignCenter().Text("توقيع المستلم").Bold().FontSize(8.5f);
                        c.Item().PaddingTop(25).AlignCenter().Text("..................................").FontColor(Colors.Grey.Lighten1);
                    });
                }

                if (_settings.ShowSupplierName)
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().AlignCenter().Text(_settings.SupplierTitle).Bold().FontSize(8.5f);
                        c.Item().PaddingTop(25).AlignCenter().Text("..................................").FontColor(Colors.Grey.Lighten1);
                    });
                }
            });
        }
        #endregion

        #region التذييل ورقم الصفحة
        private void ComposeFooter(IContainer container)
        {
            container.BorderTop(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingTop(4).Row(row =>
            {
                row.RelativeItem().AlignRight().Text(x =>
                {
                    x.Span("طبعت بواسطة منظومة DUBSAR المحاسبية • ");
                    x.Span(DateTime.Now.ToString("yyyy/MM/dd HH:mm")).FontColor(Colors.Grey.Darken1);
                });

                row.RelativeItem().AlignLeft().Text(x =>
                {
                    x.Span("صفحة ");
                    x.CurrentPageNumber();
                    x.Span(" من ");
                    x.TotalPages();
                });
            });
        }
        #endregion
    }
}
