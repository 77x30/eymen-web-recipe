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

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Show splash screen first
            using (var splash = new SplashForm())
            {
                splash.ShowDialog();
            }

            // Then show main form
            Application.Run(new MainForm());
        }
    }
}
