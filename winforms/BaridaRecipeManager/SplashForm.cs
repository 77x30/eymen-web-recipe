using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;
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
            "Sunucu bağlantısı kontrol ediliyor...",
            "Güncellemeler denetleniyor...",
            "Sistem hazırlanıyor..."
        };
        private int currentMessageIndex = 0;
        private float loadingBarPosition = 0;
        private string displayVersion = Program.APP_VERSION;

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
                await CheckForUpdatesFromAPI();
                await Task.Delay(2000);
                
                this.Invoke((Action)(() =>
                {
                    animationTimer.Stop();
                    this.DialogResult = DialogResult.OK;
                    this.Close();
                }));
            });
        }

        private async Task CheckForUpdatesFromAPI()
        {
            try
            {
                UpdateStatus("Güncellemeler kontrol ediliyor...");
                
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(10);
                    
                    // Check updates via API
                    var apiUrl = $"{Program.API_URL}/api/updates/check?current_version={Program.APP_VERSION}";
                    var response = await client.GetStringAsync(apiUrl);
                    var json = JObject.Parse(response);
                    
                    var hasUpdate = json["hasUpdate"]?.Value<bool>() ?? false;
                    
                    if (hasUpdate)
                    {
                        var newVersion = json["version"]?.Value<string>() ?? "latest";
                        var downloadUrl = json["download_url"]?.Value<string>() 
                            ?? $"{Program.PRODUCTION_URL}/downloads/BaridaRecipeManager-Setup.exe";
                        var releaseNotes = json["release_notes"]?.Value<string>() ?? "";
                        
                        displayVersion = newVersion;
                        UpdateStatus($"Yeni güncelleme bulundu: v{newVersion}");
                        await Task.Delay(800);
                        
                        await DownloadAndInstallUpdate(downloadUrl, newVersion);
                    }
                    else
                    {
                        UpdateStatus("Uygulama güncel.");
                    }
                }
            }
            catch
            {
                UpdateStatus("Çevrimdışı modda başlatılıyor...");
            }
        }
        
        private async Task DownloadAndInstallUpdate(string downloadUrl, string newVersion)
        {
            try
            {
                UpdateStatus("Güncelleme indiriliyor...");
                
                // Download zip file
                var zipPath = Path.Combine(Path.GetTempPath(), "BaridaRecipeManager-Update.zip");
                var extractPath = Path.Combine(Path.GetTempPath(), "BaridaRecipeManager-Update");
                
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(5);
                    
                    // Download zip from production URL
                    var zipUrl = $"{Program.PRODUCTION_URL}/downloads/BaridaRecipeManager.zip";
                    var response = await client.GetAsync(zipUrl, HttpCompletionOption.ResponseHeadersRead);
                    response.EnsureSuccessStatusCode();
                    
                    var totalBytes = response.Content.Headers.ContentLength ?? -1;
                    var downloadedBytes = 0L;
                    
                    using (var stream = await response.Content.ReadAsStreamAsync())
                    using (var fileStream = new FileStream(zipPath, FileMode.Create, FileAccess.Write, FileShare.None))
                    {
                        var buffer = new byte[8192];
                        int bytesRead;
                        
                        while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                        {
                            await fileStream.WriteAsync(buffer, 0, bytesRead);
                            downloadedBytes += bytesRead;
                            
                            if (totalBytes > 0)
                            {
                                var percent = (int)((downloadedBytes * 100) / totalBytes);
                                UpdateStatus($"İndiriliyor... %{percent}");
                            }
                        }
                    }
                }
                
                UpdateStatus("Güncelleme hazırlanıyor...");
                
                // Clean up old extract folder
                if (Directory.Exists(extractPath))
                {
                    Directory.Delete(extractPath, true);
                }
                
                // Extract zip
                ZipFile.ExtractToDirectory(zipPath, extractPath);
                
                // Save installed version
                var versionDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "BaridaRecipeManager");
                Directory.CreateDirectory(versionDir);
                File.WriteAllText(Path.Combine(versionDir, "installed_version.txt"), newVersion);
                
                UpdateStatus("Güncelleme başlatılıyor...");
                await Task.Delay(500);
                
                // Create update batch script
                var currentExe = Application.ExecutablePath;
                var currentDir = Path.GetDirectoryName(currentExe);
                var newExe = Path.Combine(extractPath, "BaridaRecipeManager.exe");
                var batchPath = Path.Combine(Path.GetTempPath(), "barida_update.bat");
                
                var batchContent = $@"@echo off
timeout /t 2 /nobreak > nul
xcopy /s /y ""{extractPath}\*"" ""{currentDir}""
start """" ""{currentExe}""
del ""%~f0""
";
                File.WriteAllText(batchPath, batchContent);
                
                // Run batch and exit
                var startInfo = new ProcessStartInfo
                {
                    FileName = batchPath,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = true
                };
                Process.Start(startInfo);
                
                // Exit current application
                Environment.Exit(0);
            }
            catch
            {
                UpdateStatus("Güncelleme indirilemedi.");
            }
        }
        
        private void UpdateStatus(string message)
        {
            if (this.InvokeRequired)
            {
                this.Invoke((Action)(() => UpdateStatus(message)));
                return;
            }
            
            currentMessageIndex = -1; // Custom message
            statusMessages[0] = message;
            this.Invalidate();
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

            // Version - show from API
            using (var font = new Font("Segoe UI", 9))
            using (var brush = new SolidBrush(Color.FromArgb(100, 255, 255, 255)))
            {
                var text = $"v{displayVersion}";
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
