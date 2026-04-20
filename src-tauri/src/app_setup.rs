use tauri::App;
#[cfg(target_os = "windows")]
use tauri::Manager;
use crate::screenshot::cleanup_temp_screenshot_dir;
use crate::window;
use crate::tray::create_tray;

pub fn setup_app(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle();

    cleanup_temp_screenshot_dir(&app_handle);

    // Explicitly disable window decorations on Windows
    #[cfg(target_os = "windows")]
    {
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.set_decorations(false);
            let _ = window.set_title("NovaFlow");
        }
    }

    // Setup window event listeners
    window::setup_window_events(&app_handle)?;

    // Create system tray
    let _tray = create_tray(&app_handle)?;

    Ok(())
}
