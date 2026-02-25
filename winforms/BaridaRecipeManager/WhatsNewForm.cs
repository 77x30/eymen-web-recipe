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
            this.Size = new Size(450, 350);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.White;
            this.DoubleBuffered = true;
            this.ShowInTaskbar = false;
            
            // Make form rounded
            this.Region = CreateRoundedRegion(this.Width, this.Height, 16);
            
            // Add shadow effect
            this.Paint += WhatsNewForm_Paint;
            
            // Header panel
            var headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 80,
                BackColor = Color.FromArgb(34, 197, 94) // Green
            };
            
            var iconLabel = new Label
            {
                Text = "🎉",
                Font = new Font("Segoe UI Emoji", 28),
                AutoSize = true,
                ForeColor = Color.White,
                Location = new Point(20, 15)
            };
            headerPanel.Controls.Add(iconLabel);
            
            var titleLabel = new Label
            {
                Text = "Yeni Güncelleme!",
                Font = new Font("Segoe UI", 18, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = true,
                Location = new Point(75, 15)
            };
            headerPanel.Controls.Add(titleLabel);
            
            var versionLabel = new Label
            {
                Text = $"Versiyon {version}",
                Font = new Font("Segoe UI", 11),
                ForeColor = Color.FromArgb(220, 255, 255, 255),
                AutoSize = true,
                Location = new Point(75, 48)
            };
            headerPanel.Controls.Add(versionLabel);
            
            this.Controls.Add(headerPanel);
            
            // Content panel
            var contentPanel = new Panel
            {
                Location = new Point(0, 80),
                Size = new Size(450, 200),
                BackColor = Color.White,
                Padding = new Padding(25)
            };
            
            // Date label
            if (releasedAt.HasValue)
            {
                var dateLabel = new Label
                {
                    Text = $"📅 {releasedAt.Value.ToString("dd MMMM yyyy, HH:mm")}",
                    Font = new Font("Segoe UI", 10),
                    ForeColor = Color.FromArgb(107, 114, 128),
                    AutoSize = true,
                    Location = new Point(25, 10)
                };
                contentPanel.Controls.Add(dateLabel);
            }
            
            // Note label with word wrap
            var noteLabel = new Label
            {
                Text = !string.IsNullOrEmpty(note) ? note : "Bu güncelleme ile sistem iyileştirmeleri yapıldı.",
                Font = new Font("Segoe UI", 11),
                ForeColor = Color.FromArgb(55, 65, 81),
                Location = new Point(25, releasedAt.HasValue ? 40 : 20),
                Size = new Size(400, 130),
                AutoSize = false
            };
            contentPanel.Controls.Add(noteLabel);
            
            this.Controls.Add(contentPanel);
            
            // Footer panel with button
            var footerPanel = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 70,
                BackColor = Color.FromArgb(249, 250, 251),
                Padding = new Padding(25, 15, 25, 15)
            };
            
            var continueButton = new Button
            {
                Text = "Devam Et",
                Font = new Font("Segoe UI", 11, FontStyle.Bold),
                Size = new Size(400, 40),
                Location = new Point(25, 15),
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
