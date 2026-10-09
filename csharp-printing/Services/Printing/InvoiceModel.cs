using System;
using System.Collections.Generic;

namespace Dubsar.Services.Printing
{
    public class InvoiceItemModel
    {
        public int Index { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Unit { get; set; } = "قطعة";
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalPrice => (Quantity * UnitPrice) - Discount;
    }

    public class InvoicePrintDataModel
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; } = DateTime.Now;
        public string PaymentMethod { get; set; } = "نقدي";

        // بيانات العميل
        public string CustomerName { get; set; } = "زبون نقدي";
        public string CustomerPhone { get; set; } = string.Empty;
        public string CustomerAddress { get; set; } = string.Empty;

        // قائمة المواد
        public List<InvoiceItemModel> Items { get; set; } = new();

        // الحسابات المالية
        public decimal TotalItemsAmount { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal PreviousBalance { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal NetTotal => (TotalItemsAmount - TotalDiscount);
        public decimal RemainingBalance => (NetTotal + PreviousBalance) - PaidAmount;

        public string Notes { get; set; } = "البضاعة المباعة ترد أو تستبدل خلال 3 أيام بشرط سلامة التغليف.";
    }
}
