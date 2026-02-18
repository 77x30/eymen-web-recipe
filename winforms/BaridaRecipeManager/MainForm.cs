using System;
using System.Drawing;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using Newtonsoft.Json.Linq;

namespace BaridaRecipeManager
{
    public partial class MainForm : Form
    {
        private WebView2 webView;
        private Panel loadingOverlay;
        private Label loadingLabel;
        private Timer updateCheckTimer;
        private string lastContentHash = "";

        public MainForm()
        {
            InitializeComponent();
            InitializeWebView();
            InitializeUpdateChecker();
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
            }
            catch (Exception ex)
            {
                MessageBox.Show($"WebView2 başlatılamadı: {ex.Message}\n\nWebView2 Runtime yüklü olduğundan emin olun.",
                    "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void CoreWebView2_NavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            ShowLoadingOverlay("Yükleniyor...");
        }

        private void CoreWebView2_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            HideLoadingOverlay();
        }

        private void InitializeUpdateChecker()
        {
            updateCheckTimer = new Timer();
            updateCheckTimer.Interval = 30000; // 30 seconds
            updateCheckTimer.Tick += async (s, e) => await CheckForLiveUpdate();
            updateCheckTimer.Start();
        }

        private async Task CheckForLiveUpdate()
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(5);
                    var response = await client.GetStringAsync($"{Program.PRODUCTION_URL}/api/health");
                    var json = JObject.Parse(response);
                    var buildVersion = json["buildVersion"]?.ToString() ?? "";

                    if (!string.IsNullOrEmpty(buildVersion) && buildVersion != lastContentHash && !string.IsNullOrEmpty(lastContentHash))
                    {
                        lastContentHash = buildVersion;
                        ShowLiveUpdateAnimation();
                    }
                    else if (string.IsNullOrEmpty(lastContentHash))
                    {
                        lastContentHash = buildVersion;
                    }
                }
            }
            catch
            {
                // Silently ignore
            }
        }

        private void ShowLiveUpdateAnimation()
        {
            if (this.InvokeRequired)
            {
                this.Invoke((Action)ShowLiveUpdateAnimation);
                return;
            }

            ShowLoadingOverlay("Canlı Güncelleme\nYeni içerik yükleniyor...");

            var reloadTimer = new Timer();
            reloadTimer.Interval = 1500;
            reloadTimer.Tick += (s, e) =>
            {
                reloadTimer.Stop();
                reloadTimer.Dispose();
                webView.CoreWebView2?.Reload();
            };
            reloadTimer.Start();
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
            updateCheckTimer?.Stop();
            updateCheckTimer?.Dispose();
            webView?.Dispose();
            base.OnFormClosing(e);
        }
    }
}
