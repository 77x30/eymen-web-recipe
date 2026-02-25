using System;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace BaridaRecipeManager
{
    static class Program
    {
        public const string APP_VERSION = "1.0.0";
        public const string APP_NAME = "Barida Recipe Management System";
        public const string CREATOR = "Eymen Gözel";
        public const string CREATOR_TITLE = "Otomasyon ve Yazılım Sorumlusu";
        public const string PRODUCTION_URL = "https://barida.xyz";
        public const string API_URL = "https://barida.xyz";
        
        // Store the latest version info from API
        public static string LatestVersion = APP_VERSION;
        public static string UpdateNote = null;
        public static DateTime? UpdateReleasedAt = null;
        public static bool HasNewUpdate = false;

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool SetDllDirectory(string lpPathName);

        // Returns the effective version: installed_version.txt if exists, else APP_VERSION
        public static string GetEffectiveVersion()
        {
            try
            {
                var versionFile = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "BaridaRecipeManager", "installed_version.txt");
                if (File.Exists(versionFile))
                {
                    var v = File.ReadAllText(versionFile).Trim();
                    if (!string.IsNullOrEmpty(v)) return v;
                }
            }
            catch { }
            return APP_VERSION;
        }

        // Extract native WebView2Loader.dll from embedded resources
        private static void ExtractNativeDlls()
        {
            try
            {
                var targetDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "BaridaRecipeManager", "native");
                Directory.CreateDirectory(targetDir);

                var dllPath = Path.Combine(targetDir, "WebView2Loader.dll");
                var resourceName = IntPtr.Size == 8
                    ? "BaridaRecipeManager.WebView2Loader.x64.dll"
                    : "BaridaRecipeManager.WebView2Loader.x86.dll";

                using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName))
                {
                    if (stream != null)
                    {
                        using (var fs = new FileStream(dllPath, FileMode.Create, FileAccess.Write, FileShare.None))
                        {
                            stream.CopyTo(fs);
                        }
                    }
                }

                SetDllDirectory(targetDir);
            }
            catch { }
        }

        [STAThread]
        static void Main()
        {
            try
            {
                // Extract native WebView2Loader.dll before any WebView2 usage
                ExtractNativeDlls();

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                
                // Add global exception handling
                AppDomain.CurrentDomain.UnhandledException += (sender, args) => HandleException(args.ExceptionObject as Exception);
                Application.ThreadException += (sender, args) => HandleException(args.Exception);

                // Show splash screen first
                using (var splash = new SplashForm())
                {
                    if (splash.ShowDialog() == DialogResult.OK)
                    {
                        // Then show main form if splash returns OK
                        Application.Run(new MainForm());
                    }
                }
            }
            catch (Exception ex)
            {
                HandleException(ex);
            }
        }

        static void HandleException(Exception ex)
        {
            if (ex == null) return;
            MessageBox.Show($"Application Error:\n{ex.Message}\n\nStack Trace:\n{ex.StackTrace}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
