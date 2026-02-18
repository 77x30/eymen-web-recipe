using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Net.Http;
using Newtonsoft.Json.Linq;

namespace BaridaRecipeManager
{
    public partial class SplashForm : Form
    {
        private Timer animationTimer;
        private int animationStep = 0;
        private string[] statusMessages = new string[]
        {
            "Başlatılıyor...",
            "Güncellemeler denetleniyor...",
            "Sistem hazırlanıyor...",
            "Bağlantı kuruluyor..."
        };
        private int currentMessageIndex = 0;
        private float loadingBarPosition = 0;

        public SplashForm()
        {
            InitializeComponent();
            this.DoubleBuffered = true;
            this.SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer, true);
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);

            // Start animation timer
            animationTimer = new Timer();
            animationTimer.Interval = 50;
            animationTimer.Tick += AnimationTimer_Tick;
            animationTimer.Start();

            // Start loading sequence
            Task.Run(async () =>
            {
                await CheckForUpdates();
                await Task.Delay(2500);
                
                this.Invoke((Action)(() =>
                {
                    animationTimer.Stop();
                    this.DialogResult = DialogResult.OK;
                    this.Close();
                }));
            });
        }

        private async Task CheckForUpdates()
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(5);
                    var response = await client.GetStringAsync("https://raw.githubusercontent.com/77x30/eymen-web-recipe/main/version.json");
                    var json = JObject.Parse(response);
                    var latestVersion = json["version"]?.ToString();
                    // Version check logic here if needed
                }
            }
            catch
            {
                // Silently ignore update check errors
            }
        }

        private void AnimationTimer_Tick(object sender, EventArgs e)
        {
            animationStep++;
            loadingBarPosition += 5;
            if (loadingBarPosition > this.Width + 100)
            {
                loadingBarPosition = -100;
            }

            if (animationStep % 16 == 0)
            {
                currentMessageIndex = (currentMessageIndex + 1) % statusMessages.Length;
            }

            this.Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            var g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            // Background gradient
            using (var brush = new LinearGradientBrush(
                this.ClientRectangle,
                Color.FromArgb(30, 58, 138),
                Color.FromArgb(59, 130, 246),
                LinearGradientMode.ForwardDiagonal))
            {
                g.FillRectangle(brush, this.ClientRectangle);
            }

            // Rounded corners
            using (var path = GetRoundedRectangle(this.ClientRectangle, 20))
            {
                this.Region = new Region(path);
            }

            // Logo "B"
            float scale = 1.0f + (float)Math.Sin(animationStep * 0.1) * 0.05f;
            using (var font = new Font("Arial Black", 80 * scale, FontStyle.Bold))
            using (var brush = new SolidBrush(Color.White))
            {
                var logoSize = g.MeasureString("B", font);
                g.DrawString("B", font, brush, 
                    (this.Width - logoSize.Width) / 2, 
                    60);
            }

            // Company name
            using (var font = new Font("Segoe UI", 24, FontStyle.Bold))
            using (var brush = new SolidBrush(Color.White))
            {
                var text = "BARIDA";
                var size = g.MeasureString(text, font);
                g.DrawString(text, font, brush, (this.Width - size.Width) / 2, 180);
            }

            // Subtitle
            using (var font = new Font("Segoe UI", 11))
            using (var brush = new SolidBrush(Color.FromArgb(200, 255, 255, 255)))
            {
                var text = "Recipe Management System";
                var size = g.MeasureString(text, font);
                g.DrawString(text, font, brush, (this.Width - size.Width) / 2, 215);
            }

            // Status message
            using (var font = new Font("Segoe UI", 11))
            using (var brush = new SolidBrush(Color.FromArgb(230, 255, 255, 255)))
            {
                var text = statusMessages[currentMessageIndex];
                var size = g.MeasureString(text, font);
                g.DrawString(text, font, brush, (this.Width - size.Width) / 2, 280);
            }

            // Loading bar background
            var barRect = new Rectangle(100, 310, this.Width - 200, 4);
            using (var brush = new SolidBrush(Color.FromArgb(50, 255, 255, 255)))
            {
                g.FillRectangle(brush, barRect);
            }

            // Loading bar
            using (var brush = new SolidBrush(Color.White))
            {
                var loadRect = new Rectangle((int)loadingBarPosition, 310, 80, 4);
                g.FillRectangle(brush, loadRect);
            }

            // Creator
            using (var font = new Font("Segoe UI", 9))
            using (var brush = new SolidBrush(Color.FromArgb(128, 255, 255, 255)))
            {
                var text = Program.CREATOR;
                var size = g.MeasureString(text, font);
                g.DrawString(text, font, brush, (this.Width - size.Width) / 2, this.Height - 55);
            }

            // Version
            using (var font = new Font("Segoe UI", 9))
            using (var brush = new SolidBrush(Color.FromArgb(100, 255, 255, 255)))
            {
                var text = $"v{Program.APP_VERSION}";
                var size = g.MeasureString(text, font);
                g.DrawString(text, font, brush, (this.Width - size.Width) / 2, this.Height - 35);
            }
        }

        private GraphicsPath GetRoundedRectangle(Rectangle rect, int radius)
        {
            var path = new GraphicsPath();
            path.AddArc(rect.X, rect.Y, radius * 2, radius * 2, 180, 90);
            path.AddArc(rect.Right - radius * 2, rect.Y, radius * 2, radius * 2, 270, 90);
            path.AddArc(rect.Right - radius * 2, rect.Bottom - radius * 2, radius * 2, radius * 2, 0, 90);
            path.AddArc(rect.X, rect.Bottom - radius * 2, radius * 2, radius * 2, 90, 90);
            path.CloseFigure();
            return path;
        }
    }
}
