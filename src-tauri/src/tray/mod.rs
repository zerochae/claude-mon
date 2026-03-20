use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{
    AppHandle, Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
};

use crate::session::SessionManager;

pub fn decode_png(bytes: &[u8]) -> tauri::image::Image<'static> {
    let decoder = png::Decoder::new(bytes);
    let mut reader = decoder.read_info().unwrap();
    let mut buf = vec![0; reader.output_buffer_size()];
    let info = reader.next_frame(&mut buf).unwrap();
    buf.truncate(info.buffer_size());
    tauri::image::Image::new_owned(buf, info.width, info.height)
}

pub fn setup_tray(app: &AppHandle, _session_manager: Arc<Mutex<SessionManager>>) -> tauri::Result<()> {
    let quit = MenuItemBuilder::with_id("quit", "Quit ClaudeMon").build(app)?;
    let show = MenuItemBuilder::with_id("show", "Show / Hide").build(app)?;
    let devtools = MenuItemBuilder::with_id("devtools", "Open DevTools").build(app)?;
    let menu = MenuBuilder::new(app).item(&show).item(&devtools).item(&quit).build()?;

    let frames: Vec<tauri::image::Image<'static>> = vec![
        decode_png(include_bytes!("../../icons/tray_frame_0.png")),
        decode_png(include_bytes!("../../icons/tray_frame_1.png")),
        decode_png(include_bytes!("../../icons/tray_frame_2.png")),
        decode_png(include_bytes!("../../icons/tray_frame_3.png")),
        decode_png(include_bytes!("../../icons/tray_frame_4.png")),
        decode_png(include_bytes!("../../icons/tray_frame_5.png")),
        decode_png(include_bytes!("../../icons/tray_frame_6.png")),
        decode_png(include_bytes!("../../icons/tray_frame_7.png")),
    ];

    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .icon(frames[0].clone())
        .icon_as_template(true)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "devtools" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_devtools_open() {
                        window.close_devtools();
                    } else {
                        window.open_devtools();
                    }
                }
            }
            _ => {}
        })
        .build(app)?;

    drop(tray);

    Ok(())
}
