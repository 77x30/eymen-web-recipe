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
        private string lastKnownVersion = "";
        private bool hasShownWhatsNew = false;

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
                
                // Show What's New dialog if there's a new update
                if (Program.HasNewUpdate && !hasShownWhatsNew)
                {
                    hasShownWhatsNew = true;
                    ShowWhatsNewDialog();
                }
                
                // Store current version
                lastKnownVersion = Program.LatestVersion;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"WebView2 başlatılamadı: {ex.Message}\n\nWebView2 Runtime yüklü olduğundan emin olun.",
                    "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ShowWhatsNewDialog()
        {
            // Show on UI thread with slight delay
            var timer = new Timer();
            timer.Interval = 500;
            timer.Tick += (s, e) =>
            {
                timer.Stop();
                timer.Dispose();
                
                using (var form = new WhatsNewForm(
                    Program.LatestVersion,
                    Program.UpdateNote,
                    Program.UpdateReleasedAt))
                {
                    form.ShowDialog(this);
                }
            };
            timer.Start();
        }

        private void CoreWebView2_NavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            // Don't show loading overlay - splash screen already handles initial load
            // and website has its own loading states
        }

        private void CoreWebView2_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            // Navigation completed - hide any loading overlay if shown by live update
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
                    var response = await client.GetStringAsync($"{Program.API_URL}/system/version");
                    var json = JObject.Parse(response);
                    var currentVersion = json["version"]?.ToString() ?? "";
                    var note = json["note"]?.ToString();

                    // Check if version changed since last check
                    if (!string.IsNullOrEmpty(currentVersion) && 
                        !string.IsNullOrEmpty(lastKnownVersion) && 
                        currentVersion != lastKnownVersion)
                    {
                        lastKnownVersion = currentVersion;
                        Program.LatestVersion = currentVersion;
                        Program.UpdateNote = note;
                        
                        if (DateTime.TryParse(json["released_at"]?.ToString(), out var releasedAt))
                        {
                            Program.UpdateReleasedAt = releasedAt;
                        }
                        
                        ShowLiveUpdateNotification(currentVersion, note);
                    }
                    else if (string.IsNullOrEmpty(lastKnownVersion))
                    {
                        lastKnownVersion = currentVersion;
                    }
                }
            }
            catch
            {
                // Silently ignore
            }
        }

        private void ShowLiveUpdateNotification(string version, string note)
        {
            if (this.InvokeRequired)
            {
                this.Invoke((Action<string, string>)ShowLiveUpdateNotification, version, note);
                return;
            }

            ShowLoadingOverlay($"🎉 Yeni Güncelleme: v{version}\n{note ?? "Yeni özellikler yükleniyor..."}");

            var reloadTimer = new Timer();
            reloadTimer.Interval = 2000;
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

        private void MainForm_Load(object sender, EventArgs e)
        {

        }
    }
}
