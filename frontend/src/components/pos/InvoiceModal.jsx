function InvoiceModal({ invoice, onClose }) {
    if (!invoice) return null;

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString("vi-VN") + "đ";
    };

    const formatDate = (value) => {
        return new Date(value).toLocaleString("vi-VN");
    };

    const getPaymentMethodText = (method) => {
        if (method === "cash") return "Tiền mặt";
        if (method === "bank") return "Chuyển khoản";
        if (method === "card") return "Thẻ";
        if (method === "momo") return "MoMo";
        if (method === "zalopay") return "ZaloPay";
        return method;
    };

    const printInvoice = () => {
        const paymentText =
            invoice.paymentStatus === "paid"
                ? `Đã thanh toán - ${getPaymentMethodText(invoice.paymentMethod)}`
                : "Chưa thanh toán";

        const itemsHtml = invoice.items
            .map((item) => {
                return `
          <tr>
            <td>
              <strong>${item.name}</strong>
              ${item.note ? `<div class="note">Ghi chú: ${item.note}</div>` : ""}
              <div class="small">${item.quantity} x ${formatMoney(item.price)}</div>
            </td>
            <td class="right">${formatMoney(item.quantity * item.price)}</td>
          </tr>
        `;
            })
            .join("");

        const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Hóa đơn</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #111;
              background: white;
            }

            .bill {
              width: 280px;
              padding: 12px;
              margin: 0 auto;
            }

            .center {
              text-align: center;
            }

            h1 {
              margin: 0;
              font-size: 22px;
            }

            p {
              margin: 5px 0;
              font-size: 13px;
            }

            .line {
              border-top: 1px dashed #111;
              margin: 10px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 6px 0;
              vertical-align: top;
              font-size: 13px;
            }

            .right {
              text-align: right;
              white-space: nowrap;
            }

            .small,
            .note {
              font-size: 12px;
              color: #555;
              margin-top: 3px;
            }

            .total {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: bold;
              margin-top: 8px;
            }

            .thanks {
              text-align: center;
              margin-top: 12px;
            }

            @page {
              size: 80mm auto;
              margin: 4mm;
            }

            @media print {
              body {
                width: 80mm;
              }

              .bill {
                width: 100%;
                margin: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="bill">
            <div class="center">
              <h1>POS Coffee</h1>
              <p>React + Node + MongoDB</p>
            </div>

            <div class="line"></div>

            <p><strong>Mã đơn:</strong> ${invoice._id.slice(-8).toUpperCase()}</p>
            <p><strong>Bàn:</strong> ${invoice.tableName}</p>
            <p><strong>Khách:</strong> ${invoice.customerName || "Không có"}</p>
            <p><strong>Thời gian:</strong> ${formatDate(invoice.createdAt)}</p>
            <p><strong>Thanh toán:</strong> ${paymentText}</p>

            <div class="line"></div>

            <table>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="line"></div>

            <div class="total">
              <span>Tổng cộng</span>
              <span>${formatMoney(invoice.totalAmount)}</span>
            </div>

            <div class="line"></div>

            <div class="thanks">
              <p>Cảm ơn quý khách!</p>
              <p>Hẹn gặp lại.</p>
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

        const printWindow = window.open("", "_blank", "width=400,height=700");

        if (!printWindow) {
            alert("Trình duyệt đang chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại.");
            return;
        }

        printWindow.document.open();
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    };

    return (
        <div className="invoice-overlay">
            <div className="invoice-modal">
                <div className="invoice-header">
                    <h2>Hóa đơn</h2>
                    <button onClick={onClose}>Đóng</button>
                </div>

                <div className="invoice-paper">
                    <div className="invoice-store">
                        <h1>POS Coffee</h1>
                        <p>React + Node + MongoDB</p>
                        <p>--------------------------------</p>
                    </div>

                    <div className="invoice-info">
                        <p>
                            <strong>Mã đơn:</strong> {invoice._id.slice(-8).toUpperCase()}
                        </p>

                        <p>
                            <strong>Bàn:</strong> {invoice.tableName}
                        </p>

                        <p>
                            <strong>Khách:</strong> {invoice.customerName || "Không có"}
                        </p>

                        <p>
                            <strong>Thời gian:</strong> {formatDate(invoice.createdAt)}
                        </p>

                        <p>
                            <strong>Thanh toán:</strong>{" "}
                            {invoice.paymentStatus === "paid"
                                ? `Đã thanh toán - ${getPaymentMethodText(invoice.paymentMethod)}`
                                : "Chưa thanh toán"}
                        </p>
                    </div>

                    <div className="invoice-divider"></div>

                    <div className="invoice-items">
                        {invoice.items.map((item, index) => (
                            <div className="invoice-item" key={index}>
                                <div>
                                    <strong>{item.name}</strong>
                                    {item.note && <p>Ghi chú: {item.note}</p>}
                                    <span>
                                        {item.quantity} x {formatMoney(item.price)}
                                    </span>
                                </div>

                                <strong>{formatMoney(item.quantity * item.price)}</strong>
                            </div>
                        ))}
                    </div>

                    <div className="invoice-divider"></div>

                    <div className="invoice-total">
                        <span>Tổng cộng</span>
                        <strong>{formatMoney(invoice.totalAmount)}</strong>
                    </div>

                    <div className="invoice-thanks">
                        <p>--------------------------------</p>
                        <p>Cảm ơn quý khách!</p>
                        <p>Hẹn gặp lại.</p>
                    </div>
                </div>

                <div className="invoice-actions">
                    <button onClick={printInvoice}>In hóa đơn</button>
                    <button onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
}

export default InvoiceModal;