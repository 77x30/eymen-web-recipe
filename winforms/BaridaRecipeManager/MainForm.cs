using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using Newtonsoft.Json.Linq;
using System.Diagnostics;
using System.Management;

namespace BaridaRecipeManager
{
    public partial class MainForm : Form
    {
        private WebView2 webView;
        private Panel loadingOverlay;
        private Label loadingLabel;
        private Timer telemetryTimer;
        private Timer screenshotTimer;
        private string lastKnownVersion = "";
        private string deviceId;
        private int screenshotCount = 0;
        private string screenshotFolder;

        public MainForm()
        {
            InitializeComponent();
            InitializeDeviceId();
            InitializeScreenshotFolder();
            InitializeWebView();
            InitializeTelemetry();
        }
        
        private void InitializeDeviceId()
        {
            // Generate unique device ID from machine name + hardware
            try
            {
                var cpuId = "";
                using (var mc = new ManagementClass("win32_processor"))
                using (var moc = mc.GetInstances())
                {
                    foreach (ManagementObject mo in moc)
                    {
                        cpuId = mo.Properties["processorid"].Value?.ToString() ?? "";
                        break;
                    }
                }
                deviceId = $"{Environment.MachineName}-{cpuId.Substring(0, Math.Min(8, cpuId.Length))}";
            }
            catch
            {
                deviceId = Environment.MachineName;
            }
        }
        
        private void InitializeScreenshotFolder()
        {
            screenshotFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "BaridaRecipeManager", "Screenshots");
            Directory.CreateDirectory(screenshotFolder);
        }

        private async void InitializeWebView()
        {
            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            webView.DefaultBackgroundColor = Color.FromArgb(30, 58, 138);
            this.Controls.Add(webView);

            try
            {
                // Initialize WebView2
                var env = await CoreWebView2Environment.CreateAsync();
                await webView.EnsureCoreWebView2Async(env);

                // Configure settings
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
                webView.CoreWebView2.Settings.IsZoomControlEnabled = false;

                // Handle navigation
                webView.CoreWebView2.NavigationStarting += CoreWebView2_NavigationStarting;
                webView.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;

                // Navigate to production URL
                webView.CoreWebView2.Navigate(Program.PRODUCTION_URL);
                
                // Store current version
                lastKnownVersion = Program.LatestVersion;
                
                // Take initial screenshot after 20 seconds
                var initialScreenshotTimer = new Timer();
                initialScreenshotTimer.Interval = 20000;
                initialScreenshotTimer.Tick += (s, e) =>
                {
                    initialScreenshotTimer.Stop();
                    initialScreenshotTimer.Dispose();
                    CaptureScreenshot();
                    
                    // Start regular screenshot timer (every 5 minutes)
                    screenshotTimer = new Timer();
                    screenshotTimer.Interval = 300000; // 5 minutes
                    screenshotTimer.Tick += (s2, e2) => CaptureScreenshot();
                    screenshotTimer.Start();
                };
                initialScreenshotTimer.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"WebView2 başlatılamadı: {ex.Message}\n\nWebView2 Runtime yüklü olduğundan emin olun.",
                    "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CoreWebView2_NavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            // Don't show loading overlay - splash screen already handles initial load
        }

        private void CoreWebView2_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            // Navigation completed
            HideLoadingOverlay();
        }

        private void InitializeTelemetry()
        {
            // Send telemetry every 30 seconds
            telemetryTimer = new Timer();
            telemetryTimer.Interval = 30000;
            telemetryTimer.Tick += async (s, e) => await SendTelemetry();
            telemetryTimer.Start();
            
            // Send initial telemetry
            _ = SendTelemetry();
        }
        
        private async Task SendTelemetry()
        {
            try
            {
                var process = Process.GetCurrentProcess();
                var ramUsageMb = process.WorkingSet64 / (1024.0 * 1024.0);
                
                var payload = new JObject
                {
                    ["device_id"] = deviceId,
                    ["username"] = Environment.UserName,
                    ["app_version"] = Program.APP_VERSION,
                    ["ram_usage_mb"] = Math.Round(ramUsageMb, 1),
                    ["os_info"] = $"{Environment.OSVersion.Platform} {Environment.OSVersion.Version}",
                    ["screen_resolution"] = $"{Screen.PrimaryScreen.Bounds.Width}x{Screen.PrimaryScreen.Bounds.Height}"
                };
                
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(5);
                    var content = new StringContent(payload.ToString(), Encoding.UTF8, "application/json");
                    await client.PostAsync($"{Program.API_URL}/system/telemetry/heartbeat", content);
                }
            }
            catch
            {
                // Silently ignore telemetry errors
            }
        }
        
        private void CaptureScreenshot()
        {
            try
            {
                if (this.InvokeRequired)
                {
                    this.Invoke((Action)CaptureScreenshot);
                    return;
                }
                
                // Capture the form
                using (var bitmap = new Bitmap(this.Width, this.Height))
                {
                    this.DrawToBitmap(bitmap, new Rectangle(0, 0, this.Width, this.Height));
                    
                    // Save with timestamp
                    var filename = $"screenshot_{DateTime.Now:yyyyMMdd_HHmmss}.jpg";
                    var filepath = Path.Combine(screenshotFolder, filename);
                    bitmap.Save(filepath, ImageFormat.Jpeg);
                    
                    screenshotCount++;
                    
                    // Keep only last 10 screenshots
                    CleanupOldScreenshots();
                }
            }
            catch
            {
                // Ignore screenshot errors
            }
        }
        
        private void CleanupOldScreenshots()
        {
            try
            {
                var files = Directory.GetFiles(screenshotFolder, "screenshot_*.jpg");
                if (files.Length > 10)
                {
                    Array.Sort(files);
                    for (int i = 0; i < files.Length - 10; i++)
                    {
                        File.Delete(files[i]);
                    }
                }
            }
            catch { }
        }

        private void ShowLoadingOverlay(string message)
        {
            if (this.InvokeRequired)
            {
                this.Invoke((Action<string>)ShowLoadingOverlay, message);
                return;
            }

            if (loadingOverlay == null)
            {
                loadingOverlay = new Panel();
                loadingOverlay.Dock = DockStyle.Fill;
                loadingOverlay.BackColor = Color.FromArgb(240, 30, 58, 138);

                loadingLabel = new Label();
                loadingLabel.Font = new Font("Segoe UI", 16, FontStyle.Bold);
                loadingLabel.ForeColor = Color.White;
                loadingLabel.TextAlign = ContentAlignment.MiddleCenter;
                loadingLabel.AutoSize = false;
                loadingLabel.Dock = DockStyle.Fill;

                loadingOverlay.Controls.Add(loadingLabel);
            }

            loadingLabel.Text = message;
            
            if (!this.Controls.Contains(loadingOverlay))
            {
                this.Controls.Add(loadingOverlay);
            }
            loadingOverlay.BringToFront();
            loadingOverlay.Visible = true;
        }

        private void HideLoadingOverlay()
        {
            if (this.InvokeRequired)
            {
                this.Invoke((Action)HideLoadingOverlay);
                return;
            }

            if (loadingOverlay != null)
            {
                loadingOverlay.Visible = false;
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            telemetryTimer?.Stop();
            telemetryTimer?.Dispose();
            screenshotTimer?.Stop();
            screenshotTimer?.Dispose();
            webView?.Dispose();
            base.OnFormClosing(e);
        }

        private void MainForm_Load(object sender, EventArgs e)
        {

        }
    }
}
