using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace BaridaRecipeManager
{
    public class WhatsNewForm : Form
    {
        private string version;
        private string note;
        private DateTime? releasedAt;

        public WhatsNewForm(string version, string note, DateTime? releasedAt)
        {
            this.version = version;
            this.note = note;
            this.releasedAt = releasedAt;
            
            InitializeForm();
        }

        private void InitializeForm()
        {
            this.Text = "Yenilikler";
            this.Size = new Size(480, 380);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.White;
            this.DoubleBuffered = true;
            this.ShowInTaskbar = false;
            
            // Make form rounded
            this.Region = CreateRoundedRegion(this.Width, this.Height, 16);
            
            // Add shadow effect
            this.Paint += WhatsNewForm_Paint;
            
            // Header panel with gradient
            var headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 100,
                BackColor = Color.FromArgb(30, 64, 175) // Blue-800
            };
            headerPanel.Paint += (s, e) =>
            {
                using (var brush = new LinearGradientBrush(
                    headerPanel.ClientRectangle,
                    Color.FromArgb(30, 64, 175),
                    Color.FromArgb(59, 130, 246),
                    LinearGradientMode.Horizontal))
                {
                    e.Graphics.FillRectangle(brush, headerPanel.ClientRectangle);
                }
                
                // Draw update icon (circle with arrow)
                e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                var iconRect = new Rectangle(25, 25, 50, 50);
                using (var iconBrush = new SolidBrush(Color.FromArgb(80, 255, 255, 255)))
                {
                    e.Graphics.FillEllipse(iconBrush, iconRect);
                }
                using (var iconPen = new Pen(Color.White, 2.5f))
                {
                    // Draw refresh arrow
                    var centerX = iconRect.X + iconRect.Width / 2;
                    var centerY = iconRect.Y + iconRect.Height / 2;
                    var radius = 14;
                    e.Graphics.DrawArc(iconPen, centerX - radius, centerY - radius, radius * 2, radius * 2, -30, 300);
                    // Arrow head
                    var arrowPoints = new PointF[]
                    {
                        new PointF(centerX + radius - 2, centerY - radius + 6),
                        new PointF(centerX + radius + 5, centerY - radius - 1),
                        new PointF(centerX + radius + 5, centerY - radius + 8)
                    };
                    e.Graphics.FillPolygon(new SolidBrush(Color.White), arrowPoints);
                }
            };
            
            var titleLabel = new Label
            {
                Text = "Yeni Guncelleme Mevcut!",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = true,
                BackColor = Color.Transparent,
                Location = new Point(90, 22)
            };
            headerPanel.Controls.Add(titleLabel);
            
            var versionLabel = new Label
            {
                Text = $"Versiyon {version}",
                Font = new Font("Segoe UI", 11),
                ForeColor = Color.FromArgb(200, 200, 255),
                AutoSize = true,
                BackColor = Color.Transparent,
                Location = new Point(90, 52)
            };
            headerPanel.Controls.Add(versionLabel);
            
            this.Controls.Add(headerPanel);
            
            // Content panel
            var contentPanel = new Panel
            {
                Location = new Point(0, 100),
                Size = new Size(480, 200),
                BackColor = Color.White,
                Padding = new Padding(25)
            };
            
            // Date info with icon
            if (releasedAt.HasValue)
            {
                var datePanel = new Panel
                {
                    Location = new Point(25, 15),
                    Size = new Size(430, 30),
                    BackColor = Color.FromArgb(249, 250, 251)
                };
                datePanel.Paint += (s, e) =>
                {
                    e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                    // Draw calendar icon
                    using (var pen = new Pen(Color.FromArgb(107, 114, 128), 1.5f))
                    {
                        e.Graphics.DrawRectangle(pen, 8, 6, 14, 14);
                        e.Graphics.DrawLine(pen, 8, 11, 22, 11);
                        e.Graphics.DrawLine(pen, 11, 4, 11, 8);
                        e.Graphics.DrawLine(pen, 19, 4, 19, 8);
                    }
                };
                
                var dateLabel = new Label
                {
                    Text = releasedAt.Value.ToString("dd MMMM yyyy, HH:mm"),
                    Font = new Font("Segoe UI", 10),
                    ForeColor = Color.FromArgb(107, 114, 128),
                    AutoSize = true,
                    BackColor = Color.Transparent,
                    Location = new Point(30, 6)
                };
                datePanel.Controls.Add(dateLabel);
                contentPanel.Controls.Add(datePanel);
            }
            
            // Note label with word wrap
            var noteLabel = new Label
            {
                Text = !string.IsNullOrEmpty(note) ? note : "Bu guncelleme ile sistem iyilestirmeleri yapildi.",
                Font = new Font("Segoe UI", 11),
                ForeColor = Color.FromArgb(55, 65, 81),
                Location = new Point(25, releasedAt.HasValue ? 55 : 20),
                Size = new Size(430, 130),
                AutoSize = false
            };
            contentPanel.Controls.Add(noteLabel);
            
            this.Controls.Add(contentPanel);
            
            // Footer panel with button
            var footerPanel = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 80,
                BackColor = Color.FromArgb(249, 250, 251),
                Padding = new Padding(25, 15, 25, 15)
            };
            
            var continueButton = new Button
            {
                Text = "Devam Et",
                Font = new Font("Segoe UI", 11, FontStyle.Bold),
                Size = new Size(430, 45),
                Location = new Point(25, 17),
                FlatStyle = FlatStyle.Flat,
                BackColor = Color.FromArgb(59, 130, 246),
                ForeColor = Color.White,
                Cursor = Cursors.Hand
            };
            continueButton.FlatAppearance.BorderSize = 0;
            continueButton.Click += (s, e) => this.Close();
            
            // Hover effects
            continueButton.MouseEnter += (s, e) => continueButton.BackColor = Color.FromArgb(37, 99, 235);
            continueButton.MouseLeave += (s, e) => continueButton.BackColor = Color.FromArgb(59, 130, 246);
            
            footerPanel.Controls.Add(continueButton);
            this.Controls.Add(footerPanel);
            
            // Allow closing with Escape key
            this.KeyPreview = true;
            this.KeyDown += (s, e) =>
            {
                if (e.KeyCode == Keys.Escape || e.KeyCode == Keys.Enter)
                {
                    this.Close();
                }
            };
        }

        private void WhatsNewForm_Paint(object sender, PaintEventArgs e)
        {
            // Draw border
            using (var pen = new Pen(Color.FromArgb(229, 231, 235), 1))
            {
                e.Graphics.DrawRectangle(pen, 0, 0, this.Width - 1, this.Height - 1);
            }
        }

        private Region CreateRoundedRegion(int width, int height, int radius)
        {
            var path = new GraphicsPath();
            path.AddArc(0, 0, radius * 2, radius * 2, 180, 90);
            path.AddArc(width - radius * 2, 0, radius * 2, radius * 2, 270, 90);
            path.AddArc(width - radius * 2, height - radius * 2, radius * 2, radius * 2, 0, 90);
            path.AddArc(0, height - radius * 2, radius * 2, radius * 2, 90, 90);
            path.CloseFigure();
            return new Region(path);
        }

        // Allow form to be draggable
        protected override void WndProc(ref Message m)
        {
            const int WM_NCHITTEST = 0x84;
            const int HTCLIENT = 0x1;
            const int HTCAPTION = 0x2;

            base.WndProc(ref m);

            if (m.Msg == WM_NCHITTEST && (int)m.Result == HTCLIENT)
            {
                m.Result = (IntPtr)HTCAPTION;
            }
        }
    }
}
