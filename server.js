const express = require("express");
const path = require("path");
const multer = require("multer");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// 解析表单与 JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件目录（必须指向 public）
app.use(express.static(path.join(__dirname, "public")));

// 上传文件目录（uploads）
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });

// ===============================
// 注册公司 API
// ===============================
app.post("/api/registerCompany", upload.single("logo"), (req, res) => {
    const { name, description } = req.body;
    const logo = req.file ? req.file.filename : null;

    db.run(
        "INSERT INTO companies (name, description, logo) VALUES (?, ?, ?)",
        [name, description, logo],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// ===============================
// 注册商铺 API
// ===============================
app.post("/api/registerShop", upload.single("logo"), (req, res) => {
    const { name, description } = req.body;
    const logo = req.file ? req.file.filename : null;

    db.run(
        "INSERT INTO shops (name, description, logo) VALUES (?, ?, ?)",
        [name, description, logo],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// ===============================
// 获取公司列表
// ===============================
app.get("/api/companies", (req, res) => {
    db.all("SELECT * FROM companies", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ===============================
// 获取商铺列表
// ===============================
app.get("/api/shops", (req, res) => {
    db.all("SELECT * FROM shops", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ===============================
// 启动服务器
// ===============================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
