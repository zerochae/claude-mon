#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitInfo {
    pub branch: Option<String>,
    pub added: u32,
    pub removed: u32,
    pub changed_files: u32,
}
