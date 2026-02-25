using System;
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
        public const string API_URL = "https://barida-recipe-manager-production.up.railway.app";
        
        // Store the latest version info from API
        public static string LatestVersion = APP_VERSION;
        public static string UpdateNote = null;
        public static DateTime? UpdateReleasedAt = null;
        public static bool HasNewUpdate = false;

        [STAThread]
        static void Main()
        {
            try
            {
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
