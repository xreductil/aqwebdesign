const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "site");
const IMAGE_DATA_DIR = path.join(ROOT, "data", "images");
const IMAGE_MAP_FILE = path.join(IMAGE_DATA_DIR, "image-map.json");
const CRAWL_FILE = path.join(ROOT, ".firecrawl", "sensen-full-crawl.json");
const FALLBACK_FILE = path.join(ROOT, "data", "crawl", "crawl-results.json");
const WP_FILES = [
  path.join(ROOT, ".firecrawl", "wp-pages.json"),
  path.join(ROOT, ".firecrawl", "wp-posts.json"),
  path.join(ROOT, ".firecrawl", "wp-posts-2.json"),
  path.join(ROOT, ".firecrawl", "wp-portfolio.json"),
];
const WORDPRESS_EXPORT_FILES = [
  path.join(ROOT, "data", "wordpress", "WordPress.2026-08-09.xml"),
  path.join(ROOT, "data", "wordpress", "WordPress.2026-08-09 (2).xml"),
];
const MISSING_URLS_FILE = path.join(ROOT, ".firecrawl", "missing-urls.txt");
const EXTRA_MARKDOWN_PAGES = [
  ["https://www.sensen.com.tw/latest-news/森森吐司/", "latest-detail-1.md"],
  ["https://www.sensen.com.tw/latest-news/歐包系列/", "latest-detail-2.md"],
  ["https://www.sensen.com.tw/new-arrival/草莓甜心-3/", "latest-detail-3.md"],
  ["https://www.sensen.com.tw/new-arrival/bebuilder-1845/", "latest-detail-4.md"],
  ["https://www.sensen.com.tw/latest-news/2025母親節蛋糕預購開跑/", "latest-detail-5.md"],
  ["https://www.sensen.com.tw/latest-news/2024新春禮盒/", "latest-detail-6.md"],
  ["https://www.sensen.com.tw/latest-news/餐盒menu/", "latest-detail-7.md"],
  ["https://www.sensen.com.tw/new-arrival/西點禮盒/", "latest-detail-8.md"],
  ["https://www.sensen.com.tw/latest-news/2023中秋dm/", "latest-detail-9.md"],
  ["https://www.sensen.com.tw/latest-news/bebuilder-1930/", "latest-detail-10.md"],
  ["https://www.sensen.com.tw/latest-news/2024母親節蛋糕/", "latest-detail-11.md"],
];
const SOURCE_ORIGIN = "https://www.sensen.com.tw";
const RETIRED_CONTENT_PATHS = new Set([
  "/author/admin",
  "/slide-types/index-slider",
  "/產品介紹/page/2",
  "/產品介紹/page/3",
  "/產品介紹/生日蛋糕-下方有dm供下載-264/page/2",
  "/latest-news/²⁰²¹-𝐅𝐚𝐭𝐡𝐞𝐫𝐬-𝐃𝐚𝐲✨-2",
  "/latest-news/父親節蛋糕預購開跑囉-2",
  "/latest-news/吉祥桂圓糕-2",
  "/latest-news/肉鬆餅-2",
  "/latest-news/彌月試吃品項-2",
  "/new-arrival/多佳米拉-2",
  "/new-arrival/芒果奶露麵包-2",
  "/new-arrival/草莓甜心-2",
  "/latest-news/📣澄和店週年慶📣",
  "/latest-news/2019頂家彌月目錄",
  "/latest-news/2021母親節蛋糕",
  "/latest-news/2022中秋dm",
  "/latest-news/2023中秋dm",
  "/latest-news/2023母親節蛋糕",
  "/latest-news/2024母親節蛋糕",
  "/latest-news/2024新春禮盒",
  "/latest-news/88節蛋糕預購開跑",
  "/latest-news/中秋dm出爐囉",
  "/latest-news/今年的森森芒果季開始囉-3",
  "/latest-news/文龍年中慶",
  "/latest-news/文龍初秋賞",
  "/latest-news/生日蛋糕卷",
  "/latest-news/肉鬆餅禮盒",
  "/latest-news/芋見幸福",
  "/latest-news/波蘿蛋黃酥-2",
  "/latest-news/春節禮盒預購開跑囉",
  "/latest-news/草莓大福禮盒",
  "/latest-news/頂家彌月🔥人氣波士頓派🔥",
  "/latest-news/森森吐司",
  "/latest-news/新富店開幕慶",
  "/latest-news/澄和店優惠",
  "/latest-news/餐盒",
  "/latest-news/餐盒menu",
  "/latest-news/歡慶新富店開幕",
  "/latest-news/bebuilder-1930",
  "/new-arrival/布丁燒",
  "/new-arrival/栗子蒙布朗-mont-blanc",
  "/new-arrival/森森蝴蝶酥",
  "/new-arrival/新品上市",
  "/new-arrival/新品上市-2",
  "/new-arrival/蝴蝶酥",
  "/new-arrival/優荔-lichi",
  "/new-arrival/new-杏仁千層酥-new",
  // Legacy crawler-derived archive and pagination pages requested for removal.
  "/latest-news/2022母親節蛋糕-2",
  "/product-types/伴手禮",
  "/product-types/冰淇淋蛋糕",
  "/product-types/所有蛋糕",
  "/product-types/所有蛋糕/page/2",
  "/product-types/所有蛋糕/page/3",
  "/product-types/生日蛋糕",
  "/product-types/生日蛋糕/page/2",
  "/product-types/造形蛋糕",
  "/產品介紹/page/4",
  "/author/mon",
  "/category/latest-news",
  "/category/latest-news/page/2",
  "/category/latest-news/page/3",
  "/category/latest-news/page/4",
  "/category/latest-news/page/5",
  "/category/latest-news/page/6",
  "/category/latest-news/page/7",
  "/category/latest-news/page/8",
  "/category/latest-news/page/9",
  "/category/latest-news/page/10",
  "/category/latest-news/page/11",
  "/category/latest-news/page/12",
  "/category/new-arrival",
  "/category/new-arrival/page/2",
  "/category/new-arrival/page/3",
  "/category/new-arrival/page/4",
  "/category/new-arrival/page/5",
  "/category/season-only",
  "/category/season-only/page/2",
  "/category/season-only/page/3",
  "/category/sensen-coffee",
  "/tag/好康",
  "/tag/新品",
  "/season-only/今年的森森芒果季開始囉",
  "/season-only/今年的森森芒果季開始囉-2",
  "/season-only/草莓芙蓮蛋糕盒",
  // 90 orphaned latest-news pages and 22 orphaned new-arrival pages.
  "/latest-news/【2019moon-cake】",
  "/latest-news/🍍🍍🍍鳳梨來了🍍🍍🍍",
  "/latest-news/🍓🍓🍓黃金草莓捲🍓🍓🍓",
  "/latest-news/🍓草莓蛋糕罐子🍓",
  "/latest-news/🍹森森全新飲品上市🍹",
  "/latest-news/🎀2019母親節蛋糕🎀預購開跑囉",
  "/latest-news/🎉春節伴手禮系列🎉",
  "/latest-news/💐明天就是母親節了💐",
  "/latest-news/100元生日蛋糕抵用卷",
  "/latest-news/11月份的好康大放送將於10號開始舉行囉",
  "/latest-news/11月份的好康大放送熱烈進行中",
  "/latest-news/1460",
  "/latest-news/1489",
  "/latest-news/1522",
  "/latest-news/1577",
  "/latest-news/2019中秋目錄即將出爐",
  "/latest-news/2019母親節蛋糕預告",
  "/latest-news/2019頂家彌月新目錄",
  "/latest-news/2019聖誕新品",
  "/latest-news/2020中秋禮盒",
  "/latest-news/2020父親節",
  "/latest-news/2020母親節蛋糕",
  "/latest-news/²⁰²¹-𝐅𝐚𝐭𝐡𝐞𝐫𝐬-𝐃𝐚𝐲✨",
  "/latest-news/2021中秋dm",
  "/latest-news/2021父親節蛋糕",
  "/latest-news/2022母親節蛋糕",
  "/latest-news/2022新春禮盒",
  "/latest-news/88節快樂",
  "/latest-news/土鳳梨酥禮盒",
  "/latest-news/中秋月圓",
  "/latest-news/中秋預購開跑",
  "/latest-news/丹麥波羅",
  "/latest-news/五倍券優惠",
  "/latest-news/文龍周年慶",
  "/latest-news/文龍週年慶",
  "/latest-news/文龍感恩季",
  "/latest-news/父愛",
  "/latest-news/父親節蛋糕預購",
  "/latest-news/父親節蛋糕預購開跑囉",
  "/latest-news/布丁燒禮盒",
  "/latest-news/生吐司",
  "/latest-news/仲夏88折",
  "/latest-news/吉祥桂圓糕",
  "/latest-news/肉鬆餅",
  "/latest-news/初夏賞",
  "/latest-news/芋頭蛋糕罐",
  "/latest-news/咖啡買一送一",
  "/latest-news/果乾塔",
  "/latest-news/法式經典檸檬塔",
  "/latest-news/法式蝴蝶酥",
  "/latest-news/波蘿蛋黃酥",
  "/latest-news/春節日式大福禮盒",
  "/latest-news/春節限定-如意發糕",
  "/latest-news/春節禮盒-買10送1",
  "/latest-news/活力陽光三明治",
  "/latest-news/重要公告",
  "/latest-news/振興券專屬優惠",
  "/latest-news/桂圓糕",
  "/latest-news/㊙情人節限定㊙",
  "/latest-news/草莓芙蓮蛋糕盒-2",
  "/latest-news/草莓芙蓮蛋糕盒-3",
  "/latest-news/草莓蛋糕盒開賣",
  "/latest-news/草莓蛋糕盒熱銷中🔥🔥🔥",
  "/latest-news/草莓藏心－季節限定",
  "/latest-news/頂家彌月油飯",
  "/latest-news/頂家彌月試吃",
  "/latest-news/森森日式烤年糕",
  "/latest-news/森森春節伴手禮預購中",
  "/latest-news/森森特調",
  "/latest-news/森森草莓季",
  "/latest-news/森森感恩季part2",
  "/latest-news/森森vip集點卡",
  "/latest-news/週三新富優惠日",
  "/latest-news/陽光三明治",
  "/latest-news/新春禮盒",
  "/latest-news/新富仲夏賞",
  "/latest-news/預購活動",
  "/latest-news/實聯制登記",
  "/latest-news/瑪格麗特",
  "/latest-news/維也納麵包",
  "/latest-news/聚財金元寶",
  "/latest-news/慶新年",
  "/latest-news/摩登媽咪",
  "/latest-news/摯愛森林",
  "/latest-news/澄和初夏賞",
  "/latest-news/澄和感恩季",
  "/latest-news/澄和慶新年",
  "/latest-news/蝴蝶酥宅配訂購",
  "/latest-news/彌月試吃品項",
  "/latest-news/職人手感",
  "/new-arrival/🍫義式巧克🍫",
  "/new-arrival/🎉蛋糕罐子-新發售🎉",
  "/new-arrival/3吋草莓塔",
  "/new-arrival/日式烤年糕",
  "/new-arrival/白葡萄",
  "/new-arrival/多佳米拉",
  "/new-arrival/芒果仙境",
  "/new-arrival/芒果奶酪",
  "/new-arrival/芒果奶露麵包",
  "/new-arrival/芒果季即將開始囉",
  "/new-arrival/芒果蛋糕盒",
  "/new-arrival/芒果輕乳酪",
  "/new-arrival/芒果慕斯",
  "/new-arrival/法式核桃",
  "/new-arrival/洛神花小吐司",
  "/new-arrival/香芒泡芙",
  "/new-arrival/草莓甜心",
  "/new-arrival/新品上市✨肉鬆球✨",
  "/new-arrival/新品上市✨蔥酥熱狗✨",
  "/new-arrival/聖誕草莓泡芙",
  "/new-arrival/葡萄圓舞曲",
  "/new-arrival/戀戀草莓季",
]);
const HOME_SLIDES = [
  ["/assets/images/image-photo-4.jpg", "SenSen Bakery bread promotion"],
  ["/assets/images/image-photo-6.jpg", "SenSen Bakery coffee promotion"],
  ["/assets/images/image-photo-1.jpg", "SenSen Bakery store information"],
  ["/assets/images/image-photo-2.jpg", "SenSen Bakery seasonal products"],
  ["/assets/images/image-photo-5.jpg", "SenSen Bakery announcement"],
];

const BIRTHDAY_CAKE_PATH = "/產品介紹/生日蛋糕-下方有dm供下載-264";
const CATERING_PATH = "/精緻外燴-355";
const TEA_PARTY_PATH = "/茶會點心-tea-party";
const BOSTON_PIE_PATH = "/頂家彌月/波士頓派系列";
const COUNTRY_CHEESE_PATH = "/頂家彌月/香村乳酪禮盒";
const COUNTRY_CHEESE_GIFTS = [
  ["country-cheese-l1.png", "L1", "6吋檸檬老奶奶x1、小檸檬x1、KT貓蛋糕x1、手工餅乾x1、草莓大理石x1"],
  ["country-cheese-l2.jpg", "L2", "6吋比利時巧克力x1、紫羅蘭x1、油飯8兩x1、紅蛋x2"],
  ["country-cheese-l3.png", "L3", "8吋烤布蕾x1、手工餅乾x1、熊大x1、小檸檬x1、油飯8兩x1、紅蛋x2"],
];
const COUNTRY_CHEESE_STYLES = [
  ["cheese.jpg", "波士頓派禮盒"],
  ["single-piece.jpg", "單條禮盒"],
  ["little-bear.jpg", "小熊禮盒"],
  ["big-bear.jpg", "大熊禮盒"],
];

const ROUND_PIE_PATH = "/頂家彌月/圓圓派-744";
const ROUND_PIE_PRODUCTS = [
  ["K1 烤布蕾", "k2.png"],
  ["K2 開心果雲石", "k2-copy.png"],
  ["K3 重乳酪(草莓/藍莓)", "k3-2.png"],
  ["K4 輕乳酪", "light-cheese.png"],
  ["K5 比利時巧克力", "k3.png"],
  ["K6 檸檬老奶奶", "k4.png"],
];

const LONG_CAKE_PATH = "/頂家彌月/彌月長條蛋糕";
const PAIRING_PATH = "/頂家彌月/搭配單品";
const THANK_YOU_CARD_PATH = "/頂家彌月/彌月謝卡";
const LONG_CAKE_HOT_PRODUCTS = [
  ["日式千層", "日是千層.png"],
  ["桂花烏龍甜心", "桂花烏龍.png"],
  ["摩卡巧克力", "a5.png"],
  ["伯爵甜心捲", "a6.png"],
  ["左岸咖啡捲", "a7.png"],
];
const LONG_CAKE_MARBLE_PRODUCTS = [
  ["草莓大理石", "strawberry-marble.png"],
  ["藍莓天使", "blueberry-angel.png"],
  ["經典巧克力", "classic-chocolate.png"],
  ["檸檬之戀", "lemon-love.png"],
  ["蜂蜜蛋糕", "a14.jpg"],
];
const LONG_CAKE_NAPOLEON_PRODUCTS = [
  ["香草拿破崙派", "f1-1.png"],
  ["巧克力拿破崙派", "f2.png"],
];

function longCakeContent() {
  const cardList = (items, className = "") => items.map(([title, image]) => `
    <article class="long-cake-product ${className}">
      <img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy">
      <h3>${escapeHtml(title)}</h3>
    </article>`).join("");
  return `<section class="long-cake-page">
    <section class="long-cake-hero"><div class="long-cake-hero-title"><h1>彌月長條蛋糕</h1></div></section>
    <div class="long-cake-baby"><img src="/assets/images/icon-baby.png" alt="" aria-hidden="true"></div>
    <section class="long-cake-feature" aria-labelledby="long-cake-feature-title">
      <div class="long-cake-feature-image"><img src="/assets/images/a2-2.jpg" alt="A1 紫羅蘭長條蛋糕" loading="lazy"></div>
      <div class="long-cake-feature-copy">
        <h2 id="long-cake-feature-title">A1 紫羅蘭</h2>
        <p class="long-cake-feature-filling">內餡：大甲芋頭+布丁</p>
        <p>嚴選大甲芋頭，綿密芋泥搭配芋頭塊與手作香草布丁。<br>一口接一口，是頂家銷售NO.1的招牌蛋糕！</p>
      </div>
    </section>
    <section class="long-cake-series" aria-labelledby="long-cake-hot-title">
      <div class="long-cake-heading long-cake-heading-hot"><p>TOP HOUSE CAKE</p><h2 id="long-cake-hot-title">熱銷蛋糕系列</h2></div>
      <div class="long-cake-grid long-cake-grid-five">${cardList(LONG_CAKE_HOT_PRODUCTS)}</div>
    </section>
    <section class="long-cake-series long-cake-series-second" aria-labelledby="long-cake-marble-title">
      <div class="long-cake-heading long-cake-heading-hot"><h2 id="long-cake-marble-title">熱銷蛋糕系列</h2></div>
      <div class="long-cake-grid long-cake-grid-five">${cardList(LONG_CAKE_MARBLE_PRODUCTS)}</div>
    </section>
    <section class="long-cake-napoleon" aria-labelledby="long-cake-napoleon-title">
      <div class="long-cake-heading long-cake-heading-hot long-cake-heading-napoleon"><h2 id="long-cake-napoleon-title">拿破崙派</h2><p>MILLE-FEUILLE</p></div>
      <div class="long-cake-grid long-cake-grid-two">${cardList(LONG_CAKE_NAPOLEON_PRODUCTS, "long-cake-napoleon-product")}</div>
    </section>
    <section class="boston-dm" id="long-cake-dm">
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-title"><strong>彌月禮盒DM下載</strong><span>⟶</span></a>
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-icon" aria-label="查看彌月禮盒 DM"><span class="boston-dm-book" aria-hidden="true"></span></a>
      <p>完整商品資訊及價格，請參閱彌月商品目錄!</p>
    </section>
  </section>`;
}

const PAIRING_FEATURES = [
  ["蝴蝶酥", "simg-5.jpg"],
  ["夏威夷豆塔", "simg-4-1.jpg"],
  ["手工餅乾", "simg-2.jpg"],
  ["鈕釦牛軋餅", "simg-3.jpg"],
];

const PAIRING_PRODUCTS = [
  ["黃金乳酪球", "s12.jpg"],
  ["草莓大福", "s10.jpg"],
  ["泡芙", "s14.jpg"],
  ["KT蛋糕", "s8.jpg"],
  ["熊大蛋糕", "s41.jpg"],
  ["小檸檬", "s9.jpg"],
  ["珍珠脆糖小泡芙", "pearl-crunch-puff.png"],
  ["鈕釦牛軋餅", "button.jpg"],
  ["杏仁千層酥", "mille-feuille.jpg"],
  ["杏加", "photo-1-6.jpg"],
  ["手工餅乾", "s13.jpg"],
  ["手工餅乾", "s22.jpg"],
  ["夏威夷豆塔", "hawaiian.jpg"],
  ["達克瓦茲", "dacquoise-3.jpg"],
  ["蝴蝶酥", "palmiers.jpg"],
  ["手工餅乾", "cookies-2.png"],
  ["手工餅乾", "cookies-1.png"],
  ["栗子燒", "chestnut-cake.png"],
  ["洋菓子", "japanese-pastry-2.png"],
  ["洋菓子", "japanese-pastry.png"],
  ["油飯-1斤", "s3.jpg"],
  ["油飯-半斤", "s4.jpg"],
  ["1斤油飯禮盒", "s7.jpg", "含紅蛋2入"],
  ["紅蛋-2入", "s6.jpg"],
  ["大雞腿", "simg-1.jpg"],
  ["紅龜", "red-turtle.png"],
  ["紅圓", "s24.jpg"],
];

function pairingContent() {
  const featureCards = PAIRING_FEATURES.map(([title, image]) => `
    <article class="pairing-feature-card">
      <img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy">
      <h3>${escapeHtml(title)}</h3>
      <span class="pairing-rule" aria-hidden="true"></span>
    </article>`).join("");
  const productCards = PAIRING_PRODUCTS.map(([title, image, note]) => `
    <article class="pairing-product${note ? " has-note" : ""}">
      <img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy">
      <h3>${escapeHtml(title)}</h3>
      ${note ? `<p class="pairing-product-note">${escapeHtml(note)}</p>` : ""}
      <span class="pairing-rule" aria-hidden="true"></span>
    </article>`).join("");
  return `<section class="pairing-page">
    <section class="pairing-hero" aria-labelledby="pairing-title">
      <h1 id="pairing-title">搭配單品</h1>
    </section>
    <div class="pairing-baby"><img src="/assets/images/icon-baby.png" alt="" aria-hidden="true"></div>
    <section class="pairing-intro">
      <h2>油飯及手工小西點</h2>
      <p>O I L&nbsp;&nbsp; R I C E&nbsp;&nbsp; A N D&nbsp;&nbsp; D E S S E R T</p>
    </section>
    <section class="pairing-feature-section" aria-labelledby="pairing-feature-title">
      <h2 id="pairing-feature-title" class="sr-only">油飯及手工小西點精選</h2>
      <div class="pairing-feature-grid">${featureCards}</div>
    </section>
    <section class="pairing-products" aria-labelledby="pairing-products-title">
      <h2 id="pairing-products-title" class="sr-only">搭配單品商品列表</h2>
      <div class="pairing-product-grid">${productCards}</div>
    </section>
    <aside class="pairing-tip"><span class="pairing-tip-icon" aria-hidden="true"></span><p>另有素食油飯</p></aside>
    <section class="boston-dm" id="pairing-dm">
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-title"><strong>彌月禮盒DM下載</strong><span>⟶</span></a>
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-icon" aria-label="查看彌月禮盒 DM"><span class="boston-dm-book" aria-hidden="true"></span></a>
      <p>完整商品資訊及價格，請參閱彌月商品目錄!</p>
    </section>
  </section>`;
}

function thankYouCardContent() {
  return `<section class="thankyou-page">
    <section class="thankyou-hero" aria-labelledby="thankyou-title">
      <h1 id="thankyou-title">彌月謝卡</h1>
    </section>
    <div class="thankyou-baby"><img src="/assets/images/icon-baby.png" alt="" aria-hidden="true"></div>
    <section class="thankyou-content">
      <section class="thankyou-intro" aria-labelledby="thankyou-style-title">
        <h2 id="thankyou-style-title">謝卡樣式</h2>
        <ul>
          <li>訂購即可免費製作文字謝卡。</li>
          <li>訂購滿35盒，免費升級精美相片謝卡。</li>
        </ul>
      </section>
      <div class="thankyou-grid">
        <figure><img src="/assets/images/baby-card-a.jpg" alt="A款相片謝卡" loading="lazy"></figure>
        <figure><img src="/assets/images/baby-card-b.jpg" alt="B款文字謝卡與交貨提醒" loading="lazy"></figure>
      </div>
    </section>
  </section>`;
}

function roundPieContent() {
  const cards = ROUND_PIE_PRODUCTS.map(([title, image]) => `
    <article class="round-pie-product">
      <img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy">
      <h2>${escapeHtml(title)}</h2>
      <span class="round-pie-product-rule" aria-hidden="true"></span>
    </article>`).join("");
  return `<section class="round-pie-page">
    <section class="round-pie-hero"><h1>圓圓派</h1></section>
    <section class="round-pie-products">
      <div class="round-pie-grid">${cards}</div>
    </section>
    <section class="boston-dm" id="round-pie-dm">
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-title"><strong>彌月禮盒DM下載</strong><span>⟶</span></a>
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-icon" aria-label="查看彌月禮盒 DM"><span class="boston-dm-book" aria-hidden="true"></span></a>
      <p>完整商品資訊及價格，請參閱彌月商品目錄!</p>
    </section>
  </section>`;
}

function countryCheeseContent() {
  const card = ([image, label, description]) => "<article class=\"big-bear-card\"><img src=\"/assets/images/" + escapeAttr(image) + "\" alt=\"" + escapeAttr(label) + "鄉村乳酪禮盒\" loading=\"lazy\"><h3>" + escapeHtml(label) + "</h3><p>" + escapeHtml(description) + "</p></article>";
  const cards = COUNTRY_CHEESE_GIFTS.map(card).join("");
  const styleCards = COUNTRY_CHEESE_STYLES.map(([image, label]) => "<figure class=\"big-bear-style-card\"><img src=\"/assets/images/" + escapeAttr(image) + "\" alt=\"" + escapeAttr(label) + "\" loading=\"lazy\"></figure>").join("");
  return "<section class=\"big-bear-page country-cheese-page\"><section class=\"big-bear-hero\"><div class=\"big-bear-hero-title\"><h1>鄉村乳酪禮盒</h1></div></section><div class=\"big-bear-baby\"><img src=\"/assets/images/icon-baby.png\" alt=\"\" aria-hidden=\"true\"></div><section class=\"big-bear-section country-cheese-products\"><div class=\"big-bear-grid big-bear-grid-three\">" + cards + "</div></section><section class=\"big-bear-styles\"><h2>••• 禮盒款式 •••</h2><div class=\"big-bear-style-grid\">" + styleCards + "</div></section><section class=\"boston-dm\" id=\"country-cheese-dm\"><a href=\"https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view\" target=\"_blank\" rel=\"noreferrer\" class=\"boston-dm-title\"><strong>彌月禮盒DM下載</strong><span>⟶</span></a><a href=\"https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view\" target=\"_blank\" rel=\"noreferrer\" class=\"boston-dm-icon\" aria-label=\"查看彌月禮盒 DM\"><span class=\"boston-dm-book\" aria-hidden=\"true\"></span></a><p>完整商品資訊及價格，請參閱彌月商品目錄!</p></section></section>";
}


const BIG_BEAR_PATH = "/頂家彌月/大熊-小熊禮盒";
const PRODUCT_INTRO_PATH = "/產品介紹";
const EMERALD_LYSK_PATH = "/product-item/綠寶石萊思克季節限定-1870";
const BEAN_TART_PATH = "/product-item/豆塔禮盒";
const TASTE_APPLY_PATH = "/頂家彌月/taste_apply";
const FROZEN_BREAD_PATH = "/產品介紹/冷凍麵包";
const STORE_INFO_HERO_SOURCE = "/assets/images/headtitle-bg6.jpg";
const BIRTHDAY_CAKE_PAGE_TITLE = "蛋糕 (下方有DM供下載)";

const SEASONAL_CATALOGS = new Map([
  [FROZEN_BREAD_PATH, {
    title: "冷凍麵包",
    eyebrow: "FROZEN BREAD",
    intro: "嚴選麵包品項，方便冷凍保存，隨時享用森森的手作風味。",
    products: [
      ["職人手感麵包", "bread.jpg", "手作麵包"],
      ["奶露芒果麵包", "truffle-mango-bread.jpg", "季節風味"],
      ["甜麵包系列", "party-sweet-bread-1.jpg", "手作麵包"],
      ["甜麵包系列", "party-sweet-bread-4.jpg", "手作麵包"],
      ["鹹麵包系列", "party-salty-bread-1.jpg", "手作麵包"],
      ["鹹麵包系列", "party-salty-bread-2.jpg", "手作麵包"],
      ["鹹麵包系列", "party-salty-bread-3.jpg", "手作麵包"],
      ["鹹麵包系列", "party-salty-bread-5.jpg", "手作麵包"],
      ["鹹麵包系列", "party-salty-bread-7.jpg", "手作麵包"],
      ["鹹麵包系列", "party-salty-bread-8.jpg", "手作麵包"],
    ],
  }],
]);

const CAKE_SECTIONS = [
  {
    eyebrow: "BIRTHDAY CAKE",
    title: BIRTHDAY_CAKE_PAGE_TITLE,
    icon: "/assets/images/icon-cake.png",
    products: [
      ["綠寶石萊思克<br>(季節限定)", "10", "cake-2024-11.png", "/product-item/%e7%b6%a0%e5%af%b6%e7%9f%b3%e8%90%8a%e6%80%9d%e5%85%8b%e5%ad%a3%e7%af%80%e9%99%90%e5%ae%9a-1870/"],
      ["草莓萊思克(季<br>節限定)", "17", "cake-2024-10.png", "/product-item/%e8%8d%89%e8%8e%93%e8%90%8a%e6%80%9d%e5%85%8b%e5%ad%a3%e7%af%80%e9%99%90%e5%ae%9a-1868/"],
      ["焦糖派對", "31", "cake-2024-1.png", "/product-item/%e7%84%a6%e7%b3%96%e6%b4%be%e5%b0%8d-732/"],
      ["古拉瓦", "14", "cake-21.png", "/product-item/%e5%8f%a4%e6%8b%89%e7%93%a6/"],
      ["百香洋梨", "25", "cake-2024-2.png", "/product-item/%e7%99%be%e9%a6%99%e6%b4%8b%e6%a2%a8-728/"],
      ["繽紛世界", "34", "cake-2020-12.png", "/product-item/%e7%b9%bd%e7%b4%9b%e4%b8%96%e7%95%8c/"],
      ["摩卡", "16", "cake-15-2.png", "/product-item/%e6%91%a9%e5%8d%a1/"],
      ["榛果脆心巧思", "10", "cake-13-1.png", "/product-item/%e6%a6%9b%e6%9e%9c%e8%84%86%e5%bf%83%e5%b7%a7%e6%80%9d/"],
      ["黑森林", "17", "cake-2020-4.png", "/product-item/%e9%bb%91%e6%a3%ae%e6%9e%97/"],
      ["雪芙蕾", "20", "cake-11.png", "/product-item/%e9%9b%aa%e8%8a%99%e8%95%be/"],
    ],
    loadMoreProducts: [
      ["馬卡龍森林", "34", "cake-2020-15.png", "/product-item/%e9%a6%ac%e5%8d%a1%e9%be%8d%e6%a3%ae%e6%9e%97/"],
      ["草莓修多(季節限定)", "5", "cake-9.png", "/product-item/%e8%8d%89%e8%8e%93%e4%bf%ae%e5%a4%9a%e5%ad%a3%e7%af%80%e9%99%90%e5%ae%9a/"],
      ["玫瑰花束", "3", "cake-2024-6.png", "/product-item/%e7%8e%ab%e7%91%b0%e8%8a%b1%e6%9d%9f-210/"],
      ["波笛", "3", "cake-2024-7.png", "/product-item/%e6%b3%a2%e7%ac%9b-209/"],
      ["泡芙王國", "9", "cake-5-2.png", "/product-item/%e6%b3%a1%e8%8a%99%e7%8e%8b%e5%9c%8b/"],
      ["宇治禾風", "3", "cake-2024-8.png", "/product-item/%e5%ae%87%e6%b2%bb%e7%a6%be%e9%a2%a8-205/"],
      ["藍莓萊思克", "2", "cake-2024-9.png", "/product-item/%e8%97%8d%e8%8e%93%e8%90%8a%e6%80%9d%e5%85%8b-204/"],
      ["天使", "6", "cake-2020-8.png", "/product-item/%e5%a4%a9%e4%bd%bf/"],
    ],
    loadMore: true,
  },
  {
    eyebrow: "CARTOON SHAPE CAKE",
    title: "造型蛋糕",
    products: [
      ["蜘蛛人", "8", "dsc03882.png", "/product-item/%e8%9c%98%e8%9b%9b%e4%ba%ba-1157/"],
      ["北極熊", "11", "cake-2020-9.png", "/product-item/%e5%8c%97%e6%a5%b5%e7%86%8a/"],
      ["喜八柴柴", "5", "cake-2024-3.png", "/product-item/%e5%96%9c%e5%85%ab%e6%9f%b4%e6%9f%b4-259/"],
      ["拉拉熊", "5", "cake-cartoon-6.png", "/product-item/%e6%8b%89%e6%8b%89%e7%86%8a/"],
      ["皮卡丘", "9", "cake-2024-5.png", "/product-item/%e7%9a%ae%e5%8d%a1%e4%b8%98/"],
      ["可愛兔", "5", "cake-cartoon-2-2.png", "/product-item/%e5%8f%af%e6%84%9b%e5%85%94/"],
    ],
  },
  {
    eyebrow: "ICE CREAM CAKE",
    title: "冰淇淋蛋糕",
    products: [
      ["OREO", "36", "cake-2024-15.png", "/product-item/oreo%e5%86%b0%e6%b7%87%e6%b7%8b%e8%9b%8b%e7%b3%95-1878/"],
      ["黃色小鴨", "23", "cake-2024-14.png", "/product-item/%e9%bb%83%e8%89%b2%e5%b0%8f%e9%b4%a8-1876/"],
      ["莓麗朵", "24", "cake-2024-12.png", "/product-item/%e8%8e%93%e9%ba%97%e6%9c%b5-245/"],
      ["黑爵士", "22", "cake-2024-13.png", "/product-item/%e9%bb%91%e7%88%b5%e5%a3%ab-207/"],
    ],
  },
];

const COFFEE_MENU_SECTIONS = [
  { title: "咖啡類", items: [
    ["黑咖啡", "Black Coffee", "冷／熱", "M NT$65 · L NT$80"], ["原味拿鐵", "Coffee Latte", "冷／熱", "M NT$85 · L NT$100"],
    ["青梅氣泡冰咖啡", "Green plum sparkling coffee", "冷", "NT$95"], ["西西里青檸冰咖啡", "Lemon ice coffee", "冷", "NT$75"],
    ["纖橙冰咖啡", "Orange ice coffee", "冷", "NT$75"], ["卡布奇諾", "Cappuccino", "冷／熱", "M NT$85 · L NT$100"],
    ["摩卡", "Mocha", "冷／熱", "M NT$90 · L NT$110"], ["焦糖瑪奇朵", "Caramel macchiato", "冷／熱", "M NT$95 · L NT$115"],
    ["麥芽威士忌拿鐵", "Whisky Latte", "冷／熱", "M NT$95 · L NT$115"], ["香草拿鐵", "Flavored Latte (Vanilla)", "冷／熱", "M NT$90 · L NT$110"],
    ["榛果拿鐵", "Flavored Latte (Hazelnut)", "冷／熱", "M NT$90 · L NT$110"]
  ]},
  { title: "氣泡飲類", items: [
    ["香橙泡泡", "Orange bubble drink", "冷", "NT$75"], ["柚子泡泡", "Pomelo bubble drink", "冷", "NT$75"],
    ["葡萄泡泡", "Grape bubble drink", "冷", "NT$75"], ["水蜜桃泡泡", "Peach bubble drink", "冷", "NT$75"],
    ["蔓越莓氣泡果醋", "Cranberry vinegar bubble drink", "冷", "NT$75"]
  ]},
  { title: "茶飲類", items: [
    ["英式紅茶", "Black tea", "冷／熱", "NT$55"], ["森森綠茶", "Green tea", "冷／熱", "NT$55"],
    ["台茶12號", "Jin Xuan Oolong tea", "冷／熱", "NT$65"], ["玄米綠茶", "Brown rice tea", "冷／熱", "NT$65"],
    ["韓式柚子飲", "Pomelo tea", "冷／熱", "NT$75"], ["花果蜜茶", "Fruit honey tea", "冷／熱", "NT$75"],
    ["養生花茶", "Scented tea", "冷／熱", "NT$75"], ["伯爵紅茶", "Earl black tea", "冷／熱", "NT$65"],
    ["柚香綠茶", "Pomelo tea", "冷／熱", "NT$75"]
  ]},
  { title: "奶茶類", items: [
    ["就是奶茶", "British milk tea", "冷／熱", "M NT$75 · L NT$85"], ["伯爵奶茶", "Earl milk tea", "冷／熱", "M NT$75 · L NT$85"],
    ["黑糖歐蕾", "Brown sugar au lait", "冷／熱", "M NT$80 · L NT$95"], ["可可歐蕾", "Cocoa au lait", "冷／熱", "M NT$90 · L NT$105"],
    ["抹茶歐蕾", "Matcha au lait", "冷／熱", "M NT$90 · L NT$105"]
  ]}
];

const COFFEE_MENU_IMAGES = {
  "咖啡類": "coffee.jpg",
  "氣泡飲類": "yogurt-drink.jpg",
  "茶飲類": "tea-12-number.jpg",
  "奶茶類": "coffee-2.jpg",
};

const COFFEE_MENU_PRODUCT_IDS = {
  "黑咖啡": "drink-black-coffee", "原味拿鐵": "drink-coffee-latte", "青梅氣泡冰咖啡": "drink-green-plum-sparkling-coffee", "西西里青檸冰咖啡": "drink-lemon-ice-coffee", "纖橙冰咖啡": "drink-orange-ice-coffee", "卡布奇諾": "drink-cappuccino", "摩卡": "drink-mocha", "焦糖瑪奇朵": "drink-caramel-macchiato", "麥芽威士忌拿鐵": "drink-whisky-latte", "香草拿鐵": "drink-vanilla-latte", "榛果拿鐵": "drink-hazelnut-latte",
  "香橙泡泡": "drink-orange-bubble", "柚子泡泡": "drink-pomelo-bubble", "葡萄泡泡": "drink-grape-bubble", "水蜜桃泡泡": "drink-peach-bubble", "蔓越莓氣泡果醋": "drink-cranberry-vinegar-bubble",
  "英式紅茶": "drink-black-tea", "森森綠茶": "drink-sensen-green-tea", "台茶12號": "drink-jin-xuan-oolong", "玄米綠茶": "drink-brown-rice-tea", "韓式柚子飲": "drink-korean-pomelo", "花果蜜茶": "drink-fruit-honey-tea", "養生花茶": "drink-scented-tea", "伯爵紅茶": "drink-earl-black-tea", "柚香綠茶": "drink-pomelo-green-tea",
  "就是奶茶": "drink-british-milk-tea", "伯爵奶茶": "drink-earl-milk-tea", "黑糖歐蕾": "drink-brown-sugar-au-lait", "可可歐蕾": "drink-cocoa-au-lait", "抹茶歐蕾": "drink-matcha-au-lait",
};

const COFFEE_MENU_ENGLISH = {
  "黑咖啡": "Black Coffee", "原味拿鐵": "Coffee Latte", "青梅氣泡冰咖啡": "Green plum sparkling coffee", "西西里青檸冰咖啡": "Lemon ice coffee", "纖橙冰咖啡": "Orange ice coffee", "卡布奇諾": "Cappuccino", "摩卡": "Mocha", "焦糖瑪奇朵": "Caramel macchiato", "麥芽威士忌拿鐵": "Whisky Latte", "香草拿鐵": "Flavored Latte (Vanilla)", "榛果拿鐵": "Flavored Latte (Hazelnut)",
  "香橙泡泡": "Orange bubble drink", "柚子泡泡": "Pomelo bubble drink", "葡萄泡泡": "Grape bubble drink", "水蜜桃泡泡": "Peach bubble drink", "蔓越莓氣泡果醋": "Cranberry vinegar bubble drink",
  "英式紅茶": "Black tea", "森森綠茶": "Green tea", "台茶12號": "Jin Xuan Oolong tea", "玄米綠茶": "Brown rice tea", "韓式柚子飲": "Pomelo tea", "花果蜜茶": "Fruit honey tea", "養生花茶": "Scented tea", "伯爵紅茶": "Earl black tea", "柚香綠茶": "Pomelo tea",
  "就是奶茶": "British milk tea", "伯爵奶茶": "Earl milk tea", "黑糖歐蕾": "Brown sugar au lait", "可可歐蕾": "Cocoa au lait", "抹茶歐蕾": "Matcha au lait",
};

const BIRTHDAY_CAKE_PRODUCT_RECORDS = [
  ...CAKE_SECTIONS[0].products,
  ...(CAKE_SECTIONS[0].loadMoreProducts || []),
].map(([title, likes, image, href]) => ({
  title: stripTags(title),
  likes,
  image,
  href,
  path: localPathFromUrl(new URL(href, SOURCE_ORIGIN).href),
}));

const BIRTHDAY_CAKE_PRODUCT_PATHS = new Set(BIRTHDAY_CAKE_PRODUCT_RECORDS.map((product) => product.path));
const CAKE_PRODUCT_RECORDS = CAKE_SECTIONS.flatMap((section) => [
  ...section.products,
  ...(section.loadMoreProducts || []),
]).map(([title, likes, image, href]) => ({
  title: stripTags(title),
  likes,
  image,
  href,
  path: localPathFromUrl(new URL(href, SOURCE_ORIGIN).href),
}));
const CAKE_PRODUCT_PATHS = new Set(CAKE_PRODUCT_RECORDS.map((product) => product.path));
const CAKE_PRODUCT_DATA = new Map(CAKE_PRODUCT_RECORDS.map((product) => [product.path, product]));
const CAKE_PRODUCT_CATEGORY_LABELS = new Map();
const cakeCategoryLabels = ["所有蛋糕, 生日蛋糕", "所有蛋糕, 造形蛋糕", "冰淇淋蛋糕, 所有蛋糕"];
CAKE_SECTIONS.forEach((section, index) => {
  [...section.products, ...(section.loadMoreProducts || [])].forEach(([, , , href]) => {
    CAKE_PRODUCT_CATEGORY_LABELS.set(localPathFromUrl(new URL(href, SOURCE_ORIGIN).href), cakeCategoryLabels[index]);
  });
});

const NAV_ITEMS = [
  ["關於森森", "/%e9%97%9c%e6%96%bc%e6%a3%ae%e6%a3%ae/"],
  ["最新消息", "/%e6%9c%80%e6%96%b0%e6%b6%88%e6%81%af/"],
  ["線上商城", "/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/"],
  ["酒會/茶會", "/%e7%b2%be%e7%b7%bb%e5%a4%96%e7%87%b4-355/"],
  ["頂家彌月", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e6%b3%a2%e5%a3%ab%e9%a0%93%e6%b4%be%e7%b3%bb%e5%88%97/"],
  ["常見問題", "/%e5%b8%b8%e8%a6%8b%e5%95%8f%e9%a1%8c/"],
  ["門市資訊", "/%e9%96%80%e5%b8%82%e8%b3%87%e8%a8%8a/"],
  ["連絡我們", "/contact/"],
];

const BRANDED_HERO_PATHS = new Set([
  "/關於森森",
  "/最新消息",
  "/產品介紹",
  "/產品介紹/生日蛋糕-下方有dm供下載-264",
  FROZEN_BREAD_PATH,
  "/精緻外燴-355",
  "/頂家彌月",
  "/頂家彌月/波士頓派系列",
  "/常見問題",
  "/門市資訊",
  "/contact",
  "/產品介紹/伴手禮",
  "/森森咖啡",
]);

const NAV_CHILDREN = new Map([
  ["線上商城", [
    ["生日蛋糕", "/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e7%94%9f%e6%97%a5%e8%9b%8b%e7%b3%95-%e4%b8%8b%e6%96%b9%e6%9c%89dm%e4%be%9b%e4%b8%8b%e8%bc%89-264/"],
    ["伴手禮", "/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e4%bc%b4%e6%89%8b%e7%a6%ae/"],
    ["冷凍麵包", "/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e5%86%b7%e5%87%8d%e9%ba%b5%e5%8c%85/"],
    ["飲品 MENU", "/%e6%a3%ae%e6%a3%ae%e5%92%96%e5%95%a1/"],
  ]],
  ["酒會/茶會", [
    ["精緻外燴", "/%e7%b2%be%e7%b7%bb%e5%a4%96%e7%87%b4-355/"],
    ["茶會點心", "/%e8%8c%b6%e6%9c%83%e9%bb%9e%e5%bf%83-tea-party/"],
  ]],
  ["頂家彌月", [
    ["彌月試吃申請", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/taste_apply/"],
    ["波士頓派系列", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e6%b3%a2%e5%a3%ab%e9%a0%93%e6%b4%be%e7%b3%bb%e5%88%97/"],
    ["大熊/小熊禮盒", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e5%a4%a7%e7%86%8a-%e5%b0%8f%e7%86%8a%e7%a6%ae%e7%9b%92/"],
    ["圓圓派", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e5%9c%93%e5%9c%93%e6%b4%be-744/"],
    ["鄉村乳酪禮盒", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e9%a6%99%e6%9d%91%e4%b9%b3%e9%85%aa%e7%a6%ae%e7%9b%92/"],
    ["長條蛋糕", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e5%bd%8c%e6%9c%88%e9%95%b7%e6%a2%9d%e8%9b%8b%e7%b3%95/"],
    ["搭配單品", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e6%90%ad%e9%85%8d%e5%96%ae%e5%93%81/"],
    ["彌月謝卡", "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e5%bd%8c%e6%9c%88%e8%ac%9d%e5%8d%a1/"],
  ]],
]);

const STORE_MODULE_PAGES = [
  { url: `https://www.sensen.com.tw${FROZEN_BREAD_PATH}/`, title: "冷凍麵包" },
  { url: "https://www.sensen.com.tw/customer/admin/", title: "會員登入" },
  { url: "https://www.sensen.com.tw/customer/admin/backup/", title: "會員後台" },
  { url: "https://www.sensen.com.tw/cart/", title: "購物車" },
  { url: "https://www.sensen.com.tw/checkout/", title: "結帳" },
  { url: "https://www.sensen.com.tw/orders/", title: "我的訂單" },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeCrawlPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.pages)) return payload.pages;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#(\d+);/g, (match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (match, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&nbsp;/g, " ");
}

function stripTags(value) {
  return decodeEntities(String(value).replace(/<[^>]*>/g, "")).trim();
}

function readWordPressPages() {
  const records = [];
  for (const filePath of WP_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const payload = readJson(filePath);
    if (!Array.isArray(payload)) continue;
    for (const item of payload) {
      if (!item.link || !isVisiblePage(item.link)) continue;
      records.push({
        url: item.link,
        title: stripTags(item.title?.rendered || item.slug || "森森點心坊"),
        html: wpContentForItem(item),
        imageSource: item._embedded?.["wp:featuredmedia"]?.[0]?.source_url || firstImageSource(item.content?.rendered),
        source: "wordpress-api",
        date: item.date,
      });
    }
  }
  return records;
}

function xmlValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`));
  if (!match) return "";
  const value = match[1].trim();
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return cdata ? cdata[1] : decodeEntities(value);
}

function xmlPostMeta(item, key) {
  for (const match of item.matchAll(/<wp:postmeta\b[\s\S]*?<\/wp:postmeta>/g)) {
    if (xmlValue(match[0], "wp:meta_key") === key) return xmlValue(match[0], "wp:meta_value");
  }
  return "";
}

function builderHtmlFromItem(item) {
  const rawObject = xmlPostMeta(item, "mfn-page-object");
  if (!rawObject) return { html: "", image: false };
  let object;
  try {
    object = JSON.parse(rawObject);
  } catch {
    return { html: "", image: false };
  }

  const blocks = [];
  const seen = new Set();
  const images = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (value.attr?.src) images.push(String(value.attr.src));
    if (typeof value.attr?.content === "string") {
      const content = value.attr.content.trim();
      const title = String(value.attr.title || "").trim();
      const key = `${title}\n${content}`.replace(/\s+/g, " ");
      if (content && !seen.has(key) && !(title === "內容" && content === title)) {
        seen.add(key);
        if (content === title && title) {
          blocks.push(`<h3>${escapeHtml(title)}</h3>`);
        } else if (/^\s*</.test(content)) {
          blocks.push(content);
        } else {
          blocks.push(`<p>${escapeHtml(content)}</p>`);
        }
      }
    }
    if (Array.isArray(value)) value.forEach(visit);
    else Object.entries(value).forEach(([key, child]) => {
      if (key !== "content") visit(child);
    });
  };
  visit(object);
  const imageSource = images.find((src) =>
    /\.(?:jpg|jpeg|png|gif|webp)(?:[?#]|$)/i.test(src)
    && !/(?:icon-|logo|bar-|whitewall|headtitle|appicon)/i.test(src),
  );
  return {
    html: `${imageSource ? imageSlotHtml({ source: imageSource, className: "product-image" }) : ""}${blocks.join("\n")}`,
    image: Boolean(imageSource),
    imageSource: imageSource || "",
  };
}

function readWordPressExport() {
  const records = [];
  for (const filePath of WORDPRESS_EXPORT_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const xml = fs.readFileSync(filePath, "utf8");
    const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/g)].map((match) => match[0]);
    const attachmentUrls = new Map();
    for (const item of items) {
      if (xmlValue(item, "wp:post_type") !== "attachment") continue;
      const id = xmlValue(item, "wp:post_id");
      const attachmentUrl = xmlValue(item, "wp:attachment_url");
      if (id && attachmentUrl) attachmentUrls.set(id, attachmentUrl);
    }
    for (const item of items) {
      const postType = xmlValue(item, "wp:post_type");
      if (!["post", "page", "portfolio"].includes(postType) || xmlValue(item, "wp:status") !== "publish") continue;
      const rawUrl = xmlValue(item, "link");
      const url = rawUrl.replace(/^http:\/\/(?:www\.)?sensen\.com\.tw/i, SOURCE_ORIGIN);
      if (!url || !isVisiblePage(url)) continue;
      const title = xmlValue(item, "title") || xmlValue(item, "wp:post_name") || "森森點心坊";
      const rawHtml = xmlValue(item, "content:encoded") || xmlValue(item, "description");
      const builder = postType === "post" ? { html: "", image: false } : builderHtmlFromItem(item);
      const html = (rawHtml || builder.html).replace(/<!--[\s\S]*?-->/g, "").trim();
      const hasThumbnail = /<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>[\s\S]*?<wp:meta_value><!\[CDATA\[\d+\]\]><\/wp:meta_value>/.test(item);
      const thumbnailId = xmlPostMeta(item, "_thumbnail_id");
      const thumbnailSource = thumbnailId ? attachmentUrls.get(thumbnailId) : "";
      const imageSource = thumbnailSource || builder.imageSource || firstImageSource(html);
      const imagePrefix = hasThumbnail && !html.includes("image-slot")
        ? imageSlotHtml({ source: imageSource, className: "product-image" })
        : "";
      const terms = [...item.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/g)]
        .map((term) => {
          const value = term[1].trim();
          const cdata = value.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
          return cdata ? cdata[1] : decodeEntities(value);
        })
        .filter(Boolean);
      records.push({
        url,
        title,
        html: `${imagePrefix}${html}${terms.length ? `<p class="terms">${terms.map(escapeHtml).join(" / ")}</p>` : ""}`,
        imageSource,
        source: `wordpress-export-${postType}`,
        date: xmlValue(item, "wp:post_date") || xmlValue(item, "pubDate"),
      });
    }
  }
  return records;
}

function firecrawlMarkdownFileForUrl(url) {
  const parsed = new URL(url);
  const rawPath = parsed.pathname.replace(/\/+$/, "");
  const suffix = rawPath ? rawPath.replace(/\//g, "-") : "";
  return path.join(ROOT, ".firecrawl", `${parsed.hostname.replace(/^www\./, "")}${suffix}.md`);
}

function readSupplementalMarkdownPages() {
  const missingPages = fs.existsSync(MISSING_URLS_FILE)
    ? fs.readFileSync(MISSING_URLS_FILE, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => [url, firecrawlMarkdownFileForUrl(url)])
    : [];
  const sources = [...missingPages, ...EXTRA_MARKDOWN_PAGES.map(([url, file]) => [url, path.join(ROOT, ".firecrawl", file)])];
  return sources.map(([url, filePath]) => {
      if (!fs.existsSync(filePath)) return null;
      return {
        url,
        title: titleFromMarkdown(fs.readFileSync(filePath, "utf8")) || "森森點心坊",
        markdown: fs.readFileSync(filePath, "utf8"),
        source: "firecrawl-supplemental",
      };
    })
    .filter(Boolean);
}

function titleFromMarkdown(markdown) {
  const heading = markdown.match(/^#\s+(.+)$/m) || markdown.match(/^##\s+(.+)$/m);
  return heading ? heading[1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim() : "";
}

function wpContentForItem(item) {
  const content = item.content?.rendered || "";
  const excerpt = item.excerpt?.rendered || "";
  const media = item._embedded?.["wp:featuredmedia"]?.[0];
  const terms = (item._embedded?.["wp:term"] || []).flat().map((term) => term.name).filter(Boolean);
  const pieces = [];

  if (media) {
    pieces.push(imageSlotHtml({ source: media.source_url, className: "product-image" }));
  }
  if (content.trim()) {
    pieces.push(content);
  } else if (excerpt.trim()) {
    pieces.push(excerpt);
  }
  if (terms.length) {
    pieces.push(`<p class="terms">${terms.map(escapeHtml).join(" / ")}</p>`);
  }
  return pieces.join("\n");
}

function imageSlotHtml({ source = "", label = "圖片預留位", className = "" } = {}) {
  const classes = ["image-slot", className].filter(Boolean).join(" ");
  const sourceAttr = source ? ` data-image-source="${escapeAttr(source)}"` : "";
  const localFile = localImageFile(source);
  const body = localFile
    ? `<img src="/assets/images/${escapeAttr(localFile)}" alt="${escapeAttr(label)}">`
    : `<span>${escapeHtml(label)}</span>`;
  return `<div class="${classes}"${sourceAttr}>${body}</div>`;
}

function localImageFile(source) {
  if (!source || !fs.existsSync(IMAGE_MAP_FILE)) return "";
  try {
    const map = JSON.parse(fs.readFileSync(IMAGE_MAP_FILE, "utf8"));
    const requested = String(source).split("#")[0];
    const direct = map[requested] || map[String(source)];
    if (direct && fs.existsSync(path.join(IMAGE_DATA_DIR, direct))) return direct;

    // WordPress exports sometimes contain an already-local path instead of
    // the original URL. Preserve the downloaded asset in that case.
    const localPrefix = "/assets/images/";
    if (requested.startsWith(localPrefix)) {
      const localName = decodeURIComponent(requested.slice(localPrefix.length)).split("/").pop();
      if (localName && fs.existsSync(path.join(IMAGE_DATA_DIR, localName))) return localName;
    }

    // Treat http/https and percent-encoded variants of the same WordPress
    // pathname as equivalent. This handles old content that mixes protocols
    // and HTML/XML exports that encode the filename differently.
    let requestedPath = "";
    try { requestedPath = decodeURIComponent(new URL(requested).pathname); } catch {}
    if (requestedPath) {
      for (const [url, filename] of Object.entries(map)) {
        try {
          if (decodeURIComponent(new URL(url).pathname) === requestedPath
            && fs.existsSync(path.join(IMAGE_DATA_DIR, filename))) return filename;
        } catch {}
      }
    }
    return "";
  } catch {
    return "";
  }
}

function firstImageSource(value) {
  const text = String(value || "");
  const markdown = text.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/i);
  if (markdown) return markdown[1];
  const html = text.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  return html ? html[1] : "";
}

function isVisiblePage(url) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== SOURCE_ORIGIN) return false;
    if (parsed.pathname.startsWith("/wp-json")) return false;
    if (parsed.pathname.includes("xmlrpc.php")) return false;
    if (parsed.pathname.includes("/feed")) return false;
    if (parsed.pathname.match(/\.(jpg|jpeg|png|gif|webp|pdf|zip|xml)$/i)) return false;
    return true;
  } catch {
    return false;
  }
}

function isLatestNewsPaginationPath(localPath) {
  return /^\/(?:最新消息|latest-news)\/page\/\d+$/i.test(localPath);
}

function localPathFromUrl(url) {
  const parsed = new URL(url);
  const pathname = decodeURI(parsed.pathname).replace(/\/+$/, "");
  return pathname || "/";
}

function htmlFileForLocalPath(localPath) {
  if (localPath === "/") return path.join(OUT_DIR, "index.html");
  const clean = localPath.replace(/^\/+/, "");
  return path.join(OUT_DIR, clean, "index.html");
}

function routeHref(urlOrPath) {
  try {
    const parsed = new URL(urlOrPath, SOURCE_ORIGIN);
    if (parsed.origin !== SOURCE_ORIGIN) return urlOrPath;
    const localPath = localPathFromUrl(parsed.href);
    if (localPath.startsWith("/author/")) return "/%e6%9c%80%e6%96%b0%e6%b6%88%e6%81%af/";
    if (localPath === "/頂家彌月/彌月試吃申請") return "/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/taste_apply/";
    if (localPath.startsWith("/wp-content/")) return "#";
    return localPath;
  } catch {
    return urlOrPath;
  }
}

function titleFromPage(page) {
  return page.title || page.metadata?.title || "森森點心坊";
}

function pageTitleFor(page, localPath) {
  if (localPath === "/404-error") return "找不到頁面 – 森森點心坊";
  if (localPath === PRODUCT_INTRO_PATH) return "線上商城 – 森森點心坊";
  if (localPath === BIRTHDAY_CAKE_PATH) return BIRTHDAY_CAKE_PAGE_TITLE;
  return titleFromPage(page);
}

function uniquePageTitle(title, localPath, duplicatedTitles) {
  if (localPath === "/最新消息") return "最新消息 – 森森點心坊";
  if (!duplicatedTitles.has(title)) return title;
  const routeLabel = decodeURI(localPath).replace(/^\/+|\/+$/g, "").replace(/\//g, " › ") || "首頁";
  const cleanTitle = String(title).replace(/\s*[–|-]\s*森森點心坊\s*$/i, "").trim() || "森森點心坊";
  return `${cleanTitle}｜${routeLabel} – 森森點心坊`;
}

function markdownFromPage(page) {
  return page.markdown || page.content || page.text || "";
}

function readableContentLength(value, isMarkdown = false) {
  let content = String(value || "");
  if (isMarkdown) {
    content = stripNoise(content).split(/\nShare\b/i)[0];
    content = content
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  } else {
    content = stripTags(content);
  }
  return content
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\s*_`#|\\]+/g, "")
    .length;
}

function contentScore(page) {
  return Math.max(
    readableContentLength(markdownFromPage(page), true),
    readableContentLength(page.html, false),
  );
}

function mergePage(existing, incoming) {
  if (!existing) return incoming;
  const better = contentScore(incoming) > contentScore(existing) ? incoming : existing;
  const other = better === incoming ? existing : incoming;
  return {
    ...other,
    ...better,
    title: titleFromPage(better) || titleFromPage(other),
    url: better.url || other.url,
    markdown: markdownFromPage(better),
    html: better.html || "",
    source: better.source || other.source,
  };
}

function stripNoise(markdown) {
  const primaryHeading = markdown.search(/^#\s+.+$/m);
  const content = primaryHeading > 0 ? markdown.slice(primaryHeading) : markdown;
  return content
    .replace(/\[mobile menu\]\([^)]+\)/gi, "")
    .replace(/\[previous slide\]\([^)]+\)/gi, "")
    .replace(/\[next slide\]\([^)]+\)/gi, "")
    .replace(/\[Toggle submenu\]\([^)]+\)/gi, "")
    .replace(/\[menu close icon\]\([^)]+\)/gi, "")
    .replace(/\[Back to top icon\]\([^)]+\)/gi, "")
    .replace(/Do you like it\?\s*\[[^\]]*\]\([^)]+\)/gi, "")
    .replace(/\nFacebook\s*\n[\s\S]*$/i, "")
    .replace(/\n©\s*2018[\s\S]*$/i, "")
    .replace(/reCAPTCHA[\s\S]*$/i, "")
    .trim();
}

function inlineMarkdown(text) {
  const links = [];
  const source = String(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, target) => {
    const href = target.replace(/\s+["'][^"']*["']\s*$/, "").trim();
    const cleanLabel = label.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim() || "更多";
    const token = `\u0000${links.length}\u0000`;
    links.push(/\.(?:jpg|jpeg|png|gif|webp)(?:\?|#|$)/i.test(href)
      ? escapeHtml(cleanLabel)
      : `<a href="${escapeAttr(routeHref(href))}">${escapeHtml(cleanLabel)}</a>`);
    return token;
  });
  return escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\u0000(\d+)\u0000/g, (match, index) => links[Number(index)]);
}

function markdownToHtml(markdown) {
  const lines = stripNoise(markdown).split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let list = [];
  let imageSlots = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  function flushImages() {
    if (!imageSlots.length) return;
    blocks.push(`<div class="image-grid">${imageSlots.map((source) => imageSlotHtml({ source })).join("")}</div>`);
    imageSlots = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const image = line.match(/^!\[[^\]]*\]\((https?:\/\/[^)]+)\)/)
      || line.match(/^\[!\[[^\]]*\]\((https?:\/\/[^)]+)\)\]\((?:https?:\/\/[^)]+)\)/);
    if (image && /\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(image[1])) {
      flushParagraph();
      flushList();
      if (/\/((icon|bar|whitewall|home-icon)[^/]*)\.(jpg|jpeg|png|gif|webp)/i.test(image[1])) {
        flushImages();
        const localFile = localImageFile(image[1]);
        blocks.push(`<div class="image-icon-slot" data-image-source="${escapeAttr(image[1])}">${localFile ? `<img src="/assets/images/${escapeAttr(localFile)}" alt="圖片預留位">` : "<span>圖片預留位</span>"}</div>`);
      } else {
        imageSlots.push(image[1]);
      }
      continue;
    }

    flushImages();

    if (/^(?:\*\s*){3,}$/.test(line) || /^-{3,}$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push("<hr>");
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 5);
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      list.push(listItem[1]);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushImages();
  return blocks.join("\n");
}

function createIndex(pages) {
  const groups = new Map();
  for (const page of pages) {
    const localPath = localPathFromUrl(page.url);
    const first = localPath.split("/").filter(Boolean)[0] || "首頁";
    if (!groups.has(first)) groups.set(first, []);
    groups.get(first).push(page);
  }

  return [...groups.entries()].map(([group, items]) => `
    <section class="directory-group">
      <h2>${escapeHtml(decodeURIComponent(group))}</h2>
      <div class="directory-grid">
        ${items.map((page) => `<a class="directory-card" href="${escapeAttr(localPathFromUrl(page.url))}">
          <span>${escapeHtml(titleFromPage(page))}</span>
          <small>${escapeHtml(decodeURI(localPathFromUrl(page.url)))}</small>
        </a>`).join("")}
      </div>
    </section>`).join("");
}

function seoDescription(title, pathLabel, isHome) {
  if (isHome) return "森森點心坊提供生日蛋糕、彌月禮盒、伴手禮、冷凍麵包、飲品與精緻外燴服務，分享新鮮、健康、美味的幸福滋味。";
  const cleanTitle = String(title || "森森點心坊").replace(/\s+[–|-]\s+森森點心坊$/, "").trim();
  if (pathLabel === "/最新消息") return "掌握森森點心坊最新消息、季節限定商品、新品上市與門市活動資訊。";
  if (/產品介紹|蛋糕|禮盒|麵包|伴手禮|咖啡|飲品/.test(pathLabel)) return `探索森森點心坊的${cleanTitle}，查看商品特色、規格與訂購資訊。`;
  if (/聯絡我們|contact/.test(pathLabel)) return "聯絡森森點心坊，洽詢商品訂購、門市服務、彌月禮盒與精緻外燴需求。";
  return `${cleanTitle}｜森森點心坊提供新鮮、健康、美味的烘焙點心與貼心服務。`;
}

function normalizeHeadingStructure(content, localPath) {
  if (localPath === "/") {
    return `<h1 class="site-sr-only">森森點心坊｜高雄蛋糕、伴手禮與彌月禮盒</h1>${content}`;
  }
  if (["/customer", "/customer/admin", "/customer/admin/backup"].includes(localPath)) {
    return `<h1 class="site-sr-only">森森點心坊會員中心</h1>${content.replace(/<h1\b/g, "<h2").replace(/<\/h1>/g, "</h2>")}`;
  }
  return content;
}

function layout({ title, pathLabel, content, isHome = false, isAbout = false, isEmeraldLysk = false, isCakeProduct = false, isBeanTartProduct = false, isSouvenirProduct = false, heroCategoryLabel = "所有蛋糕, 生日蛋糕", hasBrandedHero = false, heroSource = "/assets/images/headtitle-bg2.jpg", showHero = true }) {
  const checkoutStyle = pathLabel === "/checkout" ? '<link rel="stylesheet" href="/assets/checkout.css">' : "";
  const normalizedPath = pathLabel === "/" ? "/" : `/${String(pathLabel || "").replace(/^\/+|\/+$/g, "")}/`;
  const canonical = `${SOURCE_ORIGIN}${encodeURI(normalizedPath)}`;
  const description = seoDescription(title, normalizedPath.replace(/\/$/, "") || "/", isHome);
  const privatePage = /^\/(?:admin|customer|cart|checkout|orders)(?:\/|$)/i.test(normalizedPath) || normalizedPath === "/最新消息文章/";
  const robotsMeta = privatePage ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow">';
  const isBirthdayCakePage = pathLabel === BIRTHDAY_CAKE_PATH || (title.includes("生日蛋糕") && title.includes("DM"));
  const productPurchaseScript = isEmeraldLysk || isCakeProduct || isBeanTartProduct || isSouvenirProduct
    ? '<script src="/assets/product-detail-purchase.js?v=20260904-4"></script>'
    : '';
  const nav = NAV_ITEMS.map(([label, href]) => {
    const children = NAV_CHILDREN.get(label) || [];
    const childMenu = children.length
      ? `<div class="submenu">${children.map(([childLabel, childHref]) => `<a href="${childHref}">${childLabel}</a>`).join("")}</div>`
      : "";
    return `<div class="menu-item"><a href="${href}">${label}${children.length ? " <span class=\"menu-arrow\">⌄</span>" : ""}</a>${childMenu}</div>`;
  }).join("");
  const heroImage = hasBrandedHero
    ? imageSlotHtml({ source: heroSource, label: "頁首背景圖片" })
    : `<div class="image-slot"><span>頁首圖片預留位</span></div>`;
  const heroTitle = title.replace(/\s+–\s+森森點心坊$/, "");
  const heroTitleHtml = isBirthdayCakePage
    ? `<a class="cake-hero-scroll" href="#cake-dm">${escapeHtml(heroTitle)}</a>`
    : escapeHtml(heroTitle);
  const hero = isHome || !showHero ? "" : (isEmeraldLysk || isCakeProduct || isBeanTartProduct || isSouvenirProduct)
    ? `<section class="page-hero product-detail-hero${isBeanTartProduct ? " bean-tart-hero" : ""}">
      <div class="hero-banner"><div class="image-slot"><span>頁首背景圖片</span></div><div class="hero-banner-title"><h1>${escapeHtml(heroTitle)}</h1><p>▱ ${escapeHtml(heroCategoryLabel)}</p></div></div>
    </section>`
    : `<section class="page-hero${hasBrandedHero ? " about-hero" : ""}">
      <div class="hero-banner">${heroImage}<div class="hero-banner-title"><p>${escapeHtml(pathLabel)}</p><h1>${heroTitleHtml}</h1></div></div>
    </section>`;
  const homeScript = isHome ? `<script>
(() => {
  const carousel = document.querySelector("[data-home-carousel]");
  if (!carousel) return;
  const track = carousel.querySelector(".carousel-track");
  const slides = [...track.querySelectorAll("[data-carousel-slide]")];
  const dots = [...document.querySelectorAll("[data-carousel-dot]")];
  const previous = carousel.querySelector("[data-carousel-previous]");
  const next = carousel.querySelector("[data-carousel-next]");
  if (slides.length < 2) return;
  const slideCount = slides.length;
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slideCount - 1].cloneNode(true);
  [firstClone, lastClone].forEach((slide) => {
    slide.classList.remove("is-active");
    slide.removeAttribute("data-carousel-slide");
    slide.setAttribute("aria-hidden", "true");
  });
  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);
  let current = 0;
  let timer;
  let isMoving = false;
  const normalized = (index) => (index + slideCount) % slideCount;
  const setTransition = (enabled) => {
    track.style.transition = enabled ? "" : "none";
  };
  const setPosition = (index) => {
    track.style.transform = "translateX(-" + ((index + 1) * 100) + "%)";
  };
  const updateState = (index) => {
    const active = normalized(index);
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === active));
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === active);
      dot.setAttribute("aria-selected", i === active ? "true" : "false");
    });
  };
  const jumpTo = (index) => {
    current = index;
    setTransition(false);
    setPosition(current);
    updateState(current);
    track.getBoundingClientRect();
    setTransition(true);
  };
  const show = (index) => {
    if (isMoving) return;
    isMoving = true;
    current = index;
    setTransition(true);
    setPosition(current);
    updateState(current);
  };
  track.addEventListener("transitionend", (event) => {
    if (event.target !== track || event.propertyName !== "transform") return;
    if (current >= slideCount) jumpTo(0);
    if (current < 0) jumpTo(slideCount - 1);
    isMoving = false;
  });
  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(current + 1), 5000);
  };
  previous?.addEventListener("click", () => { show(current - 1); restart(); });
  next?.addEventListener("click", () => { show(current + 1); restart(); });
  dots.forEach((dot, i) => dot.addEventListener("click", () => {
    if (current === slideCount - 1 && i === 0) show(slideCount);
    else if (current === 0 && i === slideCount - 1) show(-1);
    else show(i);
    restart();
  }));
  carousel.addEventListener("mouseenter", () => window.clearInterval(timer));
  carousel.addEventListener("mouseleave", restart);
  jumpTo(0);
  restart();
})();
</script>` : "";
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <link rel="canonical" href="${escapeAttr(canonical)}">
  ${robotsMeta}
  <meta property="og:locale" content="zh_TW">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="森森點心坊">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:url" content="${escapeAttr(canonical)}">
  <link rel="stylesheet" href="/assets/site.css?v=20260906-404">
  ${checkoutStyle}
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="主選單">
      <a class="brand" href="/" aria-label="森森點心坊首頁"><img class="brand-logo" src="/assets/images/logo.png" alt="森森點心坊 SenSen Bakery"></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="開啟主選單"><span></span><span></span><span></span></button>
      <div class="menu" id="site-menu">${nav}<div class="mobile-nav-actions" aria-label="森森後台功能">
        <a class="mobile-nav-action" href="/customer/admin/" aria-label="客戶後台"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5"></path></svg><span>客戶後台</span></a>
        <a class="mobile-nav-action" href="/admin/" aria-label="員工後台"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 9h8M8 13h5M8 17h3"></path></svg><span>員工後台</span></a>
      </div><a class="mobile-menu-social" href="https://www.facebook.com/sensenbakery/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a></div>
      <div class="nav-actions" aria-label="森森會員功能">
        <a class="nav-action" href="/customer/admin/" aria-label="客戶後台"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5"></path></svg></a>
        <button class="nav-action cart-trigger" type="button" aria-controls="sensen-cart-drawer" aria-expanded="false" aria-label="購物車"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L20 8H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="17" cy="20" r="1"></circle></svg><span class="cart-count" aria-live="polite">0</span></button>
        <a class="nav-action" href="/admin/" aria-label="員工後台"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 9h8M8 13h5M8 17h3"></path></svg></a>
      </div>
    </nav>
  </header>
  <main class="${isHome ? "home-main" : `page-main${isAbout ? " about-page" : ""}`}">
    ${hero}
    ${content}
  </main>
  ${homeScript}
  <script>
  (() => {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector("#site-menu");
    if (!toggle || !menu) return;
    const setMenuState = isOpen => {
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "關閉主選單" : "開啟主選單");
      menu.classList.toggle("is-open", isOpen);
    };
    toggle.addEventListener("click", () => setMenuState(!menu.classList.contains("is-open")));
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        setMenuState(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        setMenuState(false);
        toggle.focus();
      }
    });
  })();
  </script>
  <footer class="footer">© 2018 - 2026 森森點心坊. All Rights Reserved. | Design by <a href="https://www.aq-webdesign.com/index.html" target="_blank" rel="noreferrer">A.Q.webdesign</a>. | <a href="/%e9%9a%b1%e7%A7%81%e6%ac%8a%e6%a2%9d%e6%ac%be/">隱私權政策</a></footer>
  <div class="sensen-cart-overlay" id="sensen-cart-overlay" hidden></div>
  <aside class="sensen-cart-drawer" id="sensen-cart-drawer" aria-label="購物車" aria-hidden="true"><div class="sensen-cart-head"><h2>購物車</h2><button class="sensen-cart-close" type="button" aria-label="關閉購物車">×</button></div><div class="sensen-cart-body"><p data-cart-message>載入中…</p><div data-cart-items></div><div class="sensen-cart-fields" data-cart-options hidden><label>優惠碼<div class="sensen-cart-coupon-row"><input data-cart-coupon type="text" placeholder="輸入優惠碼" autocomplete="off"><button class="sensen-cart-coupon-apply" type="button" data-cart-apply-coupon>套用</button></div></label><label>Pickup date（取貨日期）<input data-cart-pickup type="date"></label><small data-cart-date-hint></small><p class="sensen-cart-quote-message" data-cart-quote-message role="status"></p></div></div><div class="sensen-cart-foot"><div class="sensen-cart-price-lines" data-cart-price-lines hidden><div><span>小計</span><strong data-cart-subtotal>$0.00</strong></div><div data-cart-discount-row hidden><span>折扣</span><strong data-cart-discount>-$0.00</strong></div><div class="is-total"><span>合計</span><strong data-cart-total>$0.00</strong></div></div><a class="button" href="/checkout/">結帳</a><a class="sensen-cart-secondary" href="/customer/admin/">前往會員中心</a></div></aside>
  ${productPurchaseScript}
  <script src="/assets/cart-drawer.js"></script>
</body>
</html>`;
}

function homeContent() {
  const giftTiles = [
    ["/assets/images/macadamia-nut-tart.jpg", "夏威夷豆塔"],
    ["/assets/images/pork-floss-pastry.jpg", "肉鬆餅"],
    ["/assets/images/palmiers-fb3.jpg", "蝴蝶酥"],
    ["/assets/images/almond-layer-pastry-1.jpg", "杏仁千層酥"],
    ["/assets/images/sun-cake-thumbnail-copy.jpg", "經典奶油餅"],
    ["/assets/images/egg-roll-1.jpg", "手工蛋捲"],
    ["/assets/images/assorted-cookies.jpg", "綜合餅乾"],
    ["/assets/images/sandwich-7-2.jpg", "三明治點心"],
  ].map(([source, label]) => `<a class="gift-tile" href="/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e4%bc%b4%e6%89%8b%e7%a6%ae/" aria-label="${escapeAttr(label)}"><img src="${escapeAttr(source)}" alt="${escapeAttr(label)}"></a>`).join("");
  const slides = HOME_SLIDES.map(([source, label], index) => `<div class="carousel-slide${index === 0 ? " is-active" : ""}" data-carousel-slide>
      ${imageSlotHtml({ source, label })}
    </div>`).join("");
  const dots = HOME_SLIDES.map(([, label], index) => `<button type="button" class="slider-dot${index === 0 ? " is-active" : ""}" data-carousel-dot aria-label="顯示第 ${index + 1} 張輪播圖片" aria-selected="${index === 0 ? "true" : "false"}"></button>`).join("");
  return `<section class="home-copy">
    <div class="hero-split">
      <div class="home-carousel" data-home-carousel aria-label="首頁輪播">
        <div class="carousel-viewport"><div class="carousel-track">${slides}</div></div>
        <div class="carousel-controls-row">
          <button type="button" class="carousel-control previous" data-carousel-previous aria-label="上一張">‹</button>
          <div class="slider-dots" role="tablist" aria-label="首頁輪播控制項">${dots}</div>
          <button type="button" class="carousel-control next" data-carousel-next aria-label="下一張">›</button>
        </div>
      </div>
    </div>
  </section>
  <section class="home-intro"><div class="home-intro-copy"><div class="home-intro-copy-title"><h2>享受</h2><h3>嘴角上揚的幸福</h3></div><div class="home-intro-copy-lower"><span class="wheat-mark">✦</span><div class="home-intro-copy-english"><p>Fresh, healthy and delicious.</p><p>Sensen always thinks about you.</p></div></div></div>
    <div class="quick-links">
      <a aria-label="生日蛋糕" href="/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e7%94%9f%e6%97%a5%e8%9b%8b%e7%b3%95-%e4%b8%8b%e6%96%b9%e6%9c%89dm%e4%be%9b%e4%b8%8b%e8%bc%89-264/">${imageSlotHtml({ source: "https://www.sensen.com.tw/wp-content/uploads/2024/11/%E9%A6%96%E9%A0%81%E5%9C%96%E7%89%87-1.jpg", label: "Birthday Cake" })}<span>Birthday Cake</span><strong>生日蛋糕</strong><span class="card-arrow" aria-hidden="true">→</span></a>
      <a aria-label="彌月禮盒" href="/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/%e6%b3%a2%e5%a3%ab%e9%a0%93%e6%b4%be%e7%b3%bb%e5%88%97/">${imageSlotHtml({ source: "https://www.sensen.com.tw/wp-content/uploads/2024/11/%E6%A3%ae%E6%A3%ae%E9%A6%96%e9%A0%81-2.jpg", label: "Baby Gift Box" })}<span>Baby Gift Box</span><strong>彌月禮盒</strong><span class="card-arrow" aria-hidden="true">→</span></a>
      <a aria-label="酒會茶會" href="/%e7%b2%be%e7%b7%bb%e5%a4%96%e7%87%b4-355/">${imageSlotHtml({ source: "https://www.sensen.com.tw/wp-content/uploads/2018/11/home-service-3.jpg", label: "Catering" })}<span>Catering</span><strong>酒會/茶會</strong><span class="card-arrow" aria-hidden="true">→</span></a>
    </div>
  </section>
  <section class="home-taste"><div class="image-slot"><span>彌月試吃圖片預留位</span></div><div><h2>彌月試吃申請</h2><p class="eyebrow">TOP HOUSE &amp; SENSEN BAKERY</p><p>無論您是懷孕中的媽咪或是寶寶剛誕生，都感謝您給予機會選<br class="home-taste-mobile-break">擇森森彌月蛋糕，讓我們與您一同分享這份幸福的喜悅！(產<br class="home-taste-mobile-break">前產後均可申請。產前建議懷孕35週以上的媽咪唷!)</p><a class="button" href="/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/taste_apply/">線上申請</a></div></section>
  <section class="home-section" data-home-news-section hidden><div class="section-heading"><div><p class="eyebrow">latest news</p><h2>最新消息</h2></div><a href="/%e6%9c%80%e6%96%b0%e6%b6%88%e6%81%af/">更多訊息</a></div><div class="home-news-grid" data-home-news-list></div></section><script src="/assets/home-news.js"></script>
  <section class="gift-section"><div class="gift-copy"><img class="gift-icon" src="/assets/images/home-icon-giftbox.png" alt="" aria-hidden="true"><h2>精選伴手禮</h2><p>各式經典組合<br>多樣化的選擇<br>吃進嘴裡都是幸福的味道</p><a class="button" href="/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e4%bc%b4%e6%89%8b%e7%a6%ae/">更多伴手禮</a></div><div class="gift-mosaic">${giftTiles}</div></section>
  <section class="home-catering"><div class="catering-copy"><div class="catering-panel"><div class="catering-title-row"><img class="catering-icon" src="/assets/images/home-icon-cutlery.png" alt="" aria-hidden="true"><div><h2>酒會/外燴服務</h2><p>嚴選食材。精心烹調。味覺饗宴</p></div></div><span class="catering-wave" aria-hidden="true"></span><a class="button" href="/%e7%b2%be%e7%b7%bb%e5%a4%96%e7%87%b4-355/">了解更多 <span aria-hidden="true">›</span></a></div></div><div class="catering-images"><a class="catering-card buffet" href="/%e7%b2%be%e7%b7%bb%e5%a4%96%e7%87%b4-355/">${imageSlotHtml({ source: "/assets/images/home-buffet.jpg", label: "Buffet" })}<div class="catering-card-copy"><span>Buffet</span><strong>精緻外燴</strong><small>菜單下載</small><em aria-hidden="true">⌄</em></div></a><a class="catering-card tea-party" href="/%e8%8c%b6%e6%9c%83%e9%bb%9e%e5%bf%83-tea-party/">${imageSlotHtml({ source: "/assets/images/home-catering.jpg", label: "Tea Party" })}<div class="catering-card-copy"><span>Tea Party</span><strong>茶會點心</strong><small>菜單下載</small><em aria-hidden="true">⌄</em></div></a></div></section>
  <section class="catering-stores"><div class="catering-stores-panel"><a class="catering-store" href="https://goo.gl/maps/3oxsrUzT22G2" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>澄和店</strong><span>三民區澄和路78號</span><span>07-3816662</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a><a class="catering-store" href="https://goo.gl/maps/JptBgTTquh92" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>新富店</strong><span>鳳山區新富路276號</span><span>07-7675992</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a><a class="catering-store" href="https://goo.gl/maps/Wea9v9dtqCs" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>博愛店</strong><span>三民區博愛路219號</span><span>07-7993070</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a><a class="catering-store" href="https://goo.gl/maps/NpDLVEYQHAk" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>文龍店</strong><span>鳳山區文龍東路336號</span><span>07-7335812</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a></div></section>`;
}

function aboutContent() {
  return `<section class="about-content">
    <img class="about-wheat" src="/assets/images/icon-wheat.png" alt="" aria-hidden="true">
    <div class="about-inner">
      <div class="about-photo-grid">
        <figure class="about-photo about-photo-flavor">
          <img src="/assets/images/about-1.jpg" alt="剛出爐的麵包">
        </figure>
        <figure class="about-photo about-photo-ingredients">
          <img src="/assets/images/about-2.jpg" alt="雞蛋、麵粉與烘焙食材">
        </figure>
      </div>
      <div class="about-copy">
        <h2>品質保證，森森始終為您設想</h2>
        <h3>嘴角上揚的幸福</h3>
        <p>自2001年成立第一家森森歐式點心坊門市，經歷消費者的種種考驗與指導建議<br>下，獲得每一位消費者的青睞，並在2003年成立第二家森森歐式點心坊分店來<br>為大家服務，以滿足不斷口碑相傳的顧客。陸續再成立第三、第四家分店在鳳<br>山區域為大家服務。</p>
      </div>
    </div>
    <section class="about-flavor">
      <div class="about-flavor-inner">
        <img class="about-flavor-icons" src="/assets/images/about-3.png" alt="新鮮、健康、美味">
        <div class="about-flavor-copy">
          <h2>每一口都是幸福的滋味</h2>
          <p>為了維持優良品質，我們在每個小細節都相當注意。而每項商品也都是限量推<br>出，為了就是讓您感受每一口都是幸福的滋味。</p>
        </div>
      </div>
    </section>
    <section class="about-more">
      <img class="about-more-mark" src="/assets/images/about-4.png" alt="" aria-hidden="true">
      <h2>豐富多樣的選擇，嘴角上揚的幸福。</h2>
      <div class="about-actions">
        <a href="/%E9%96%80%E5%B8%82%E8%B3%87%E8%A8%8A/">門市據點</a>
        <a href="https://www.facebook.com/sensenbakery/" target="_blank" rel="noreferrer">Facebook</a>
      </div>
    </section>
  </section>`;
}

function productIntroContent() {
  const birthdayProducts = [
    ...CAKE_SECTIONS[0].products,
    ...(CAKE_SECTIONS[0].loadMoreProducts || []),
  ].map(([title, likes, image, href]) => ({ title: title.replace(/<br>/g, ""), likes, image, href, price: PRODUCT_PRICE_LABEL }));
  const sections = [
    {
      eyebrow: "BIRTHDAY CAKE",
      title: "生日蛋糕",
      icon: "/assets/images/icon-cake.png",
      href: "/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e7%94%9f%e6%97%a5%e8%9b%8b%e7%b3%95-%e4%b8%8b%e6%96%b9%e6%9c%89dm%e4%be%9b%e4%b8%8b%e8%bc%89-264/",
      products: birthdayProducts,
    },
    {
      eyebrow: "SOUVENIR",
      title: "伴手禮",
      icon: "/assets/images/icon-cupcake.png",
      href: "/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e4%bc%b4%e6%89%8b%e7%a6%ae/",
      products: SOUVENIR_PRODUCTS.map(([title, href, image, likes]) => ({ title, href, image, likes, price: PRODUCT_PRICE_LABEL })),
    },
    {
      eyebrow: "DRINK MENU",
      title: "飲品 MENU",
      icon: "/assets/images/icon-coffee.png",
      href: "/%e6%a3%ae%e6%a3%ae%e5%92%96%e5%95%a1/",
      kind: "menu",
      products: [
        { title: "咖啡與氣泡飲", image: "coffee-menu-1.jpg" },
        { title: "茶飲與奶茶", image: "coffee-menu-2.jpg" },
      ],
    },
  ];
  const sectionHtml = sections.map((section) => {
    const cards = section.products.map((product) => {
      if (section.kind === "menu") {
        return "<article class=\"product-intro-menu-card\"><a href=\"" + escapeAttr(section.href) + "\"><img src=\"/assets/images/" + escapeAttr(product.image) + "\" alt=\"" + escapeAttr(product.title) + "\"><strong>" + escapeHtml(product.title) + "</strong></a></article>";
      }
      return "<article class=\"product-intro-card\"><a class=\"product-intro-card-link\" href=\"" + escapeAttr(product.href) + "\"><img src=\"/assets/images/" + escapeAttr(product.image) + "\" alt=\"" + escapeAttr(product.title) + "\"><div class=\"product-intro-card-meta\"><div class=\"product-intro-card-title\"><strong>" + escapeHtml(product.title) + "</strong><span class=\"product-intro-card-price\">" + escapeHtml(product.price) + "</span></div><span class=\"product-intro-card-likes\"><b aria-hidden=\"true\">♡</b> " + escapeHtml(product.likes) + "</span></div></a></article>";
    }).join("");
    return "<section class=\"product-intro-section\" data-product-intro-section>" +
      "<div class=\"product-intro-section-heading\"><div><p>" + escapeHtml(section.eyebrow) + "</p><h2><img src=\"" + escapeAttr(section.icon) + "\" alt=\"\" aria-hidden=\"true\">" + escapeHtml(section.title) + "</h2></div><div class=\"product-intro-carousel-controls\"><button type=\"button\" data-product-intro-previous aria-label=\"向左滑動\">‹</button><button type=\"button\" data-product-intro-next aria-label=\"向右滑動\">›</button></div></div>" +
      "<div class=\"product-intro-carousel\"><div class=\"product-intro-track\" data-product-intro-track tabindex=\"0\">" + cards + "</div></div>" +
      "<a class=\"product-intro-load-more\" href=\"" + escapeAttr(section.href) + "\">▪▪ Load more</a>" +
      "</section>";
  }).join("");
  return "<section class=\"product-intro-page\">" + sectionHtml + "</section>" +
    "<script>(function(){document.querySelectorAll(\"[data-product-intro-section]\").forEach(function(section){var track=section.querySelector(\"[data-product-intro-track]\");if(!track)return;var move=function(direction){track.scrollBy({left:direction*Math.max(track.clientWidth*.82,260),behavior:\"smooth\"});};section.querySelector(\"[data-product-intro-previous]\").addEventListener(\"click\",function(){move(-1);});section.querySelector(\"[data-product-intro-next]\").addEventListener(\"click\",function(){move(1);});});})();</script>";
}

function seasonalCatalogContent(localPath) {
  const catalog = SEASONAL_CATALOGS.get(localPath);
  if (!catalog) return "";
  return `<section class="seasonal-catalog-page">
    <section class="seasonal-catalog-intro">
      <p class="seasonal-catalog-eyebrow">${escapeHtml(catalog.eyebrow)}</p>
      <h2>${escapeHtml(catalog.title)}精選</h2>
      <p class="seasonal-catalog-description">${escapeHtml(catalog.intro)}</p>
    </section>
    <section class="seasonal-catalog-empty" aria-label="${escapeAttr(catalog.title)}商品列表">
      <p>商品內容即將上架，敬請期待。</p>
    </section>
  </section>`;
}

function birthdayCakeContent() {
  const sectionHtml = CAKE_SECTIONS.map((section, index) => {
    const iconHtml = section.icon
      ? `<img class="cake-section-icon" src="${escapeAttr(section.icon)}" alt="" aria-hidden="true">`
      : "";
    const cardHtml = ([name, , image, href]) => `<article class="cake-product-card">
        <a class="cake-product-card-link" href="${escapeAttr(href)}">
          <span class="cake-product-image">
            <img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(name.replace(/<br>/g, ""))}">
          </span>
        </a>
        <div class="cake-product-meta">
          <a class="cake-product-title-link" href="${escapeAttr(href)}"><span class="cake-product-title">${name}</span><span class="cake-product-price">${PRODUCT_PRICE_LABEL}</span></a>
          <button class="cake-add-cart" type="button" data-add-cart-title="${escapeAttr(name.replace(/<br>/g, "").replace(/\(季節限定\)/g, "（季節限定）"))}">加入購物車</button>
        </div>
      </article>`;
    const cards = section.products.map(cardHtml).join("");
    const loadMoreCards = (section.loadMoreProducts || []).map(cardHtml).join("");
    const loadMore = section.loadMore
      ? `<div class="cake-load-more"><button class="cake-load-more-button" type="button" data-cake-load-more aria-expanded="false" onclick="toggleCakeProducts(this)">▪▪ Load more</button></div>`
      : "";
    const headingText = index === 0
      ? ""
      : `<p>${escapeHtml(section.eyebrow)}</p>
        <h2>${escapeHtml(section.title)}</h2>`;
    return `<section class="cake-category ${index === 0 ? "is-first" : ""}">
      <div class="cake-category-heading">
        ${iconHtml}
        ${headingText}
      </div>
      <div class="cake-product-grid">${cards}</div>${loadMoreCards ? `
      <div class="cake-product-grid cake-product-grid-more" data-cake-load-more-items hidden>${loadMoreCards}</div>` : ""}
      ${loadMore}
    </section>`;
  }).join("");

  return `<section class="cake-page">
    ${sectionHtml}
    <section class="cake-dm" id="cake-dm">
      <a href="https://drive.google.com/file/d/1QW07oLnBIAq4wa2NuMnL7oZZvS-uu0je/view" class="cake-dm-link" target="_blank" rel="noreferrer">生日蛋糕DM下載 <span aria-hidden="true">→</span></a>
      <a class="cake-dm-icon" href="https://drive.google.com/file/d/1QW07oLnBIAq4wa2NuMnL7oZZvS-uu0je/view" target="_blank" rel="noreferrer" aria-label="開啟生日蛋糕 DM"><span class="cake-dm-book" aria-hidden="true"></span></a>
      <p>森森不定期推出各式新品蛋糕，歡迎關注我們的FB。</p>
    </section>
  </section>
  <script>
  (() => {
    const toggleCakeProducts = (button) => {
      const category = button.closest(".cake-category");
      const items = category ? category.querySelector("[data-cake-load-more-items]") : null;
      if (!items) return;
      const expanded = button.getAttribute("aria-expanded") === "true";
      items.hidden = expanded;
      button.setAttribute("aria-expanded", String(!expanded));
      button.textContent = expanded ? "▪▪ Load more" : "▪▪ 收起商品";
    };
    window.toggleCakeProducts = toggleCakeProducts;
    document.addEventListener("click", (event) => {
      const button = event.target.closest ? event.target.closest("[data-cake-load-more]") : null;
      if (button) toggleCakeProducts(button);
    });
  })();
  (() => {
    document.querySelectorAll("[data-add-cart-title]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const original = button.textContent;
        button.disabled = true;
        button.textContent = "加入中…";
        try {
          const response = await fetch("/api/cart/add", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: button.dataset.addCartTitle, qty: 1 }) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "加入購物車失敗。");
          button.textContent = "已加入購物車";
          document.querySelector(".cart-trigger")?.click();
        } catch (error) {
          button.textContent = error.message;
          window.setTimeout(() => { button.textContent = original; }, 1800);
        } finally {
          button.disabled = false;
        }
      });
    });
  })();
  </script>`;
}

const CATERING_SECTIONS = [
  ["MAIN COURSE", "主食及肉類", [
    "buffet-main-meal-8.jpg", "buffet-main-meal-11.jpg", "buffet-main-meal-12.jpg",
    "buffet-main-meal-3.jpg", "buffet-main-meal-4.jpg", "buffet-main-meal-13.jpg",
    "buffet-main-meal-6.jpg", "buffet-main-meal-5.jpg", "buffet-main-meal-12-2.jpg",
  ]],
  ["SEAFOOD", "海鮮類", [
    "buffet-seafood-9.jpg", "buffet-seafood-10.jpg", "buffet-seafood-1.jpg",
    "buffet-seafood-2.jpg", "buffet-seafood-3.jpg", "yellow-sea-fresh.jpg", "sea.png",
  ]],
  ["VEGETARIAN FOOD", "素食類", ["rice.jpg"]],
  ["FRIED FOOD & OTHER", "炸物小點類", ["buffet-snacks-3.jpg", "buffet-snacks-1.jpg", "buffet-snacks-2.jpg"]],
];

function inquirySection({ id, title, subject }) {
  return `<section class="catering-inquiry" id="${escapeAttr(id)}" aria-labelledby="${escapeAttr(id)}-title">
    <div class="catering-inquiry-heading">
      <p>Inquiry</p>
      <h2 id="${escapeAttr(id)}-title">${escapeHtml(title)}</h2>
      <span>請留下活動需求，森森團隊將盡快與您聯繫。</span>
    </div>
    <form class="catering-inquiry-form" data-catering-inquiry data-inquiry-subject="${escapeAttr(subject)}" novalidate>
      <label class="catering-inquiry-field">
        <span>姓名 <b>*</b></span>
        <input name="name" type="text" placeholder="請輸入姓名" autocomplete="name" required>
      </label>
      <label class="catering-inquiry-field">
        <span>電話 <b>*</b></span>
        <input name="phone" type="tel" placeholder="請輸入聯絡電話" autocomplete="tel" required>
      </label>
      <label class="catering-inquiry-field">
        <span>Email <b>*</b></span>
        <input name="email" type="email" placeholder="you@email.com" autocomplete="email" required>
      </label>
      <label class="catering-inquiry-field">
        <span>預計人數 <b>*</b></span>
        <select name="guests" required>
          <option value="">請選擇人數</option>
          <option>2–10 人</option>
          <option>11–30 人</option>
          <option>31–50 人</option>
          <option>51–100 人</option>
          <option>101 人以上</option>
        </select>
      </label>
      <label class="catering-inquiry-field">
        <span>日期 <b>*</b></span>
        <input name="date" type="date" required>
      </label>
      <label class="catering-inquiry-field">
        <span>時間 <b>*</b></span>
        <select name="time" required>
          <option value="">請選擇時間</option>
          <option>上午 09:00</option>
          <option>上午 10:00</option>
          <option>上午 11:00</option>
          <option>下午 01:00</option>
          <option>下午 02:00</option>
          <option>下午 03:00</option>
          <option>下午 04:00</option>
          <option>下午 05:00</option>
        </select>
      </label>
      <label class="catering-inquiry-field catering-inquiry-field-wide">
        <span>特殊需求</span>
        <textarea name="specialRequests" placeholder="過敏、飲食需求、活動場合或其他需求……"></textarea>
      </label>
      <div class="catering-inquiry-actions">
        <p class="catering-inquiry-message" data-inquiry-message role="status" aria-live="polite"></p>
        <button class="catering-inquiry-submit" type="submit">送出詢價</button>
      </div>
    </form>
  </section>`;
}

function inquiryScript() {
  return `<script>
  (() => {
    document.querySelectorAll("[data-catering-inquiry]").forEach((form) => {
      const message = form.querySelector("[data-inquiry-message]");
      const button = form.querySelector("button[type=submit]");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const originalLabel = button.textContent;
        button.disabled = true;
        button.textContent = "送出中…";
        message.textContent = "";
        const value = (name) => form.elements[name]?.value.trim() || "";
        const payload = {
          name: value("name"),
          phone: value("phone"),
          email: value("email"),
          subject: form.dataset.inquirySubject || "外燴詢價",
          message: [
            "預計人數：" + value("guests"),
            "活動日期：" + value("date"),
            "活動時間：" + value("time"),
            "特殊需求：" + (value("specialRequests") || "無")
          ].join("\\n")
        };
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "送出失敗，請稍後再試。");
          form.reset();
          message.className = "catering-inquiry-message is-success";
          message.textContent = "詢價資料已送出，謝謝您！森森團隊將盡快與您聯繫。";
        } catch (error) {
          message.className = "catering-inquiry-message is-error";
          message.textContent = error.message;
        } finally {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      });
    });
  })();
  </script>`;
}

function cateringContent() {
  const sections = CATERING_SECTIONS.map(([eyebrow, title, images]) => `
    <section class="catering-category">
      <div class="catering-category-heading"><p>${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2></div>
      <div class="catering-product-grid">${images.map((image) => `<div class="catering-product"><img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}餐點"></div>`).join("")}</div>
    </section>`).join("");
  return `<section class="catering-page">
    <section class="catering-intro">
      <img class="catering-intro-icon" src="/assets/images/icon-cutlery.png" alt="" aria-hidden="true">
      <p class="catering-intro-eyebrow">Catering Service</p>
      <h1>嚴選食材。精心烹調。味覺饗宴</h1>
      <p class="catering-intro-copy">節慶與親友同事公司聚餐、商務會議與媒體公關活動<br>用心帶給您新鮮與美味的餐點，實惠的價格，美味可口的精緻菜色，森森是你最佳的選擇</p>
      <div class="catering-hero-actions">
        <a class="catering-menu-download" href="https://docs.google.com/spreadsheets/d/1KrLWkMaNHhZr7AmkgCZ4WQcbLzb99YAB/edit?gid=703529566#gid=703529566" target="_blank" rel="noreferrer"><span class="catering-menu-book" aria-hidden="true"></span><span>外燴菜單下載</span></a>
        <a class="catering-inquiry-link" href="#catering-inquiry">外燴詢價</a>
      </div>
    </section>
    ${sections}
    <section class="catering-note"><span class="catering-note-icon" aria-hidden="true"></span><p>※ <strong>完整菜單請下載最上方檔案連結</strong>，圖片為參考圖，產品請以實物為主。<strong>菜色照片會陸續更新。</strong></p></section>
    ${inquirySection({ id: "catering-inquiry", title: "外燴詢價專區", subject: "外燴詢價" })}
    <section class="catering-stores">
      <div class="catering-stores-panel">
        <a class="catering-store" href="https://goo.gl/maps/3oxsrUzT22G2" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>澄和店</strong><span>三民區澄和路78號</span><span>07-3816662</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a>
        <a class="catering-store" href="https://goo.gl/maps/JptBgTTquh92" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>新富店</strong><span>鳳山區新富路276號</span><span>07-7675992</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a>
        <a class="catering-store" href="https://goo.gl/maps/Wea9v9dtqCs" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>博愛店</strong><span>鳳山區博愛路219號</span><span>07-7993070</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a>
        <a class="catering-store" href="https://goo.gl/maps/NpDLVEYQHAk" target="_blank" rel="noreferrer"><span class="catering-store-line" aria-hidden="true"></span><strong>文龍店</strong><span>鳳山區文龍東路336號</span><span>07-7335812</span><span class="catering-store-map" aria-hidden="true">Google Map <span>→</span></span></a>
      </div>
    </section>
    ${inquiryScript()}
  </section>`;
}

const BOSTON_GIFTS = [
  ["boston-pa1.jpg", "PA1", "9吋波士頓派×1、油飯8兩×1、紅蛋×2"],
  ["boston-pa2.jpg", "PA2", "9吋波士頓派×1、小檸檬×1、KT蛋糕×1、手工餅乾×1"],
  ["boston-pa3.png", "PA3", "9吋波士頓派×1、草莓大福×3"],
  ["boston-pa4.png", "PA4", "9吋波士頓派×1、草莓大理石×1"],
];


const BIG_BEAR_GIFTS = [
  ["c1.png", "C1", "草莓大理石x1、經典巧克力x1、油飯8兩x1、紅蛋x2"],
  ["c2.png", "C2", "草莓大理石x1、鈕釦牛軋餅x1、珍珠脆糖小泡芙x1、達克瓦茲x3"],
  ["c7.png", "C3", "9吋烤布蕾x1、油飯8兩x1、紅蛋x2"],
  ["b1-copy.png", "B1", "草莓大理石x1、經典巧克力x1"],
  ["b2.png", "B2", "草莓大理石x1、小檸檬x1、KT貓蛋糕x1、手工餅干x2"],
  ["b3.png", "B3", "草莓大理石x1、油飯8兩x1、紅蛋x2"],
  ["b4.png", "B4", "草莓大理石x1、小檸檬x1、KT貓蛋糕x1、手工餅干x1、紅蛋x2"],
  ["c8.png", "C4", "6吋輕乳酪蛋糕x1、油飯8兩x1、紅蛋x2"],
];
const BIG_BEAR_STYLES = [["cheese.jpg", "波士頓派禮盒"], ["single-piece.jpg", "單條禮盒"], ["little-bear.jpg", "小熊禮盒"], ["big-bear.jpg", "大熊禮盒"]];
function bigBearContent() {
  const card = ([image, label, description]) => "<article class=\"big-bear-card" + (label === "C4" ? " big-bear-card-c4" : "") + "\"><img src=\"/assets/images/" + escapeAttr(image) + "\" alt=\"" + escapeAttr(label) + "禮盒\" loading=\"lazy\"><h3>" + escapeHtml(label) + "</h3><p>" + escapeHtml(description) + "</p></article>";
  const cards = BIG_BEAR_GIFTS.map(card);
  const styleCards = BIG_BEAR_STYLES.map(([image, label]) => "<figure class=\"big-bear-style-card\"><img src=\"/assets/images/" + escapeAttr(image) + "\" alt=\"" + escapeAttr(label) + "\" loading=\"lazy\"></figure>").join("");
  return "<section class=\"big-bear-page\"><section class=\"big-bear-hero\"><div class=\"big-bear-hero-title\"><h1>大熊/小熊禮盒</h1></div></section><div class=\"big-bear-baby\"><img src=\"/assets/images/icon-baby.png\" alt=\"\" aria-hidden=\"true\"></div><section class=\"big-bear-section\"><h2>大熊禮盒</h2><div class=\"big-bear-grid big-bear-grid-three\">" + cards.slice(0, 3).join("") + "</div></section><section class=\"big-bear-section big-bear-little-section\"><h2>小熊禮盒</h2><div class=\"big-bear-grid big-bear-grid-four\">" + cards.slice(3).join("") + "</div></section><section class=\"big-bear-styles\"><h2>••• 禮盒款式 •••</h2><div class=\"big-bear-style-grid\">" + styleCards + "</div></section><section class=\"boston-dm\" id=\"big-bear-dm\"><a href=\"https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view\" target=\"_blank\" rel=\"noreferrer\" class=\"boston-dm-title\"><strong>彌月禮盒DM下載</strong><span>⟶</span></a><a href=\"https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view\" target=\"_blank\" rel=\"noreferrer\" class=\"boston-dm-icon\" aria-label=\"查看彌月禮盒 DM\"><span class=\"boston-dm-book\" aria-hidden=\"true\"></span></a><p>完整商品資訊及價格，請參閱彌月商品目錄!</p></section></section>";
}


function bostonPieContent() {
  const giftCards = BOSTON_GIFTS.map(([image, label, description]) => `
    <article class="boston-gift-card">
      <img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(label)}彌月禮盒">
      <h3>${escapeHtml(label)}</h3>
      <p>${escapeHtml(description)}</p>
    </article>`).join("");
  return `<section class="boston-page">
    <section class="boston-product-feature">
      <div class="boston-product-visual"><img src="/assets/images/poston-cream-pie-1.png" alt="波士頓鮮奶派與禮盒"></div>
      <div class="boston-product-copy">
        <p class="boston-product-kicker">6倍乳</p>
        <h2>波士頓鮮奶派</h2>
        <p class="boston-product-english">Boston Cream Pie</p>
        <p class="boston-product-description">將鮮奶中去除83%的水，留下的精華爽口不甜<br>膩且富有細緻的口感。</p>
        <hr>
        <p class="boston-product-spec">波士頓派尺寸：9吋(23cm±10%)<br>印刷包裝：手繪水彩風格&amp;禮盒霧模搭配高質感<br>Pantone金屬色側邊。手提式紙盒設計，恕不<br>另外提供袋子</p>
        <img class="boston-vegetarian-badge" src="/assets/images/icon-vlml.png" alt="奶蛋素">
      </div>
    </section>
    <section class="boston-gift-section" id="boston-gifts">
      <h2>波士頓彌月禮盒系列</h2>
      <div class="boston-gift-grid">${giftCards}</div>
    </section>
    <section class="boston-dm" id="boston-dm">
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-title"><strong>彌月禮盒DM下載</strong><span>⟶</span></a>
      <a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer" class="boston-dm-icon" aria-label="查看彌月禮盒 DM"><span class="boston-dm-book" aria-hidden="true"></span></a>
      <p>完整商品資訊及價格，請參閱彌月商品目錄!</p>
    </section>
  </section>`;
}

const PRODUCT_PRICE_LABEL = "價格洽詢";

const SOUVENIR_PRODUCTS = [
  ["豆塔禮盒", "/product-item/豆塔禮盒", "photo-2.jpg", 9],
  ["森森肉鬆餅", "/product-item/森森肉鬆餅", "pork-floss-pastry-4.jpg", 17],
  ["法式蝴蝶酥", "/product-item/法式蝴蝶酥-1657", "palmiers-2.jpg", 8],
  ["杏仁千層酥", "/product-item/鈕扣牛軋餅", "almond-layer-pastry.jpg", 10],
  ["經典奶油餅禮盒", "/product-item/太陽餅禮盒", "sun-cake-thumbnail-copy.jpg", 6],
  ["手工蛋捲", "/product-item/手工蛋捲", "egg-roll-2.jpg", 4],
  ["鈕釦牛軋餅", "/product-item/鈕扣餅乾", "button-nougat-pastry-inside-page-3-1.jpg", 7],
  ["達克瓦茲禮盒", "/product-item/鳳梨酥禮盒", "dacquoise.jpg", 4],
  ["土鳳梨酥禮盒", "/product-item/土鳳梨酥禮盒", "pineapple-cake-copy.jpg", 7],
  ["日式大福禮盒", "/product-item/日式大福禮盒", "daifuku-3.jpg", 10],
];

const SOUVENIR_PRODUCT_PATHS = new Set(SOUVENIR_PRODUCTS.map(([, href]) => href));
const SOUVENIR_PRODUCT_DATA = new Map(SOUVENIR_PRODUCTS.map(([title, href, image, likes]) => [href, { title, image, likes }]));
// Keep a compatibility route for the misspelled URL that has been shared previously.
const PRODUCT_ROUTE_ALIASES = new Map([
  ["/product-item/法式蝶蝨酥-1657", "/product-item/法式蝴蝶酥-1657"],
  ["/隱私權條件", "/隱私權條款"],
]);

function souvenirPageContent() {
  const cards = SOUVENIR_PRODUCTS.map(([title, href, image, likes]) => `<article class="souvenir-card"><a class="souvenir-card-link" href="${escapeAttr(href)}"><img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}"><div class="souvenir-card-meta"><div class="souvenir-card-title"><h2>${escapeHtml(title)}</h2><span class="souvenir-card-price">${PRODUCT_PRICE_LABEL}</span></div><span class="souvenir-likes" aria-label="收藏 ${likes} 次"><span aria-hidden="true">♡</span> ${likes}</span></div></a><button class="souvenir-add-cart" type="button" data-souvenir-add-cart="${escapeAttr(title)}">加入購物車</button></article>`).join("");
  return `<section class="souvenir-page"><section class="souvenir-products"><img class="souvenir-icon" src="/assets/images/icon-cupcake.png" alt=""><div class="souvenir-grid">${cards}</div></section></section>
  <script>
  (() => {
    document.querySelectorAll("[data-souvenir-add-cart]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const original = button.textContent;
        button.disabled = true;
        button.textContent = "加入中…";
        try {
          const response = await fetch("/api/cart/add", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: button.dataset.souvenirAddCart, qty: 1 }) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "加入購物車失敗。");
          button.textContent = "已加入購物車";
          document.querySelector(".cart-trigger")?.click();
        } catch (error) {
          button.textContent = error.message;
          window.setTimeout(() => { button.textContent = original; }, 1800);
        } finally {
          button.disabled = false;
        }
      });
    });
  })();
  </script>`;
}

function coffeePageContent() {
  const cards = COFFEE_MENU_SECTIONS.flatMap(section => section.items.map(item => {
    const temperatures = item[2].includes('熱') ? '冷|熱' : item[2];
    const prices = [...item[3].matchAll(/\b([ML])\s*NT\$\s*([\d,.]+)/g)].map(match => `${match[1]}=${match[2].replace(/,/g, '')}`);
    if (!prices.length) prices.push(`單杯=${(item[3].match(/[\d,.]+/) || ['0'])[0].replace(/,/g, '')}`);
    return `<article class="drink-menu-card cake-product-card" data-drink-menu-item data-drink-product-id="${escapeAttr(COFFEE_MENU_PRODUCT_IDS[item[0]] || '')}" data-drink-name="${escapeAttr(item[0])}" data-drink-english="${escapeAttr(COFFEE_MENU_ENGLISH[item[0]] || item[1])}" data-drink-category="${escapeAttr(section.title)}" data-drink-temperatures="${escapeAttr(temperatures)}" data-drink-sugars="正常甜|少糖|半糖|微糖|無糖" data-drink-size-prices="${escapeAttr(prices.join('|'))}" data-drink-description="${escapeAttr(`可依照喜好調整${item[0]}的溫度、糖度與尺寸。`)}" role="button" tabindex="0"><div class="cake-product-image drink-menu-card-image"><img src="/assets/images/${escapeAttr(COFFEE_MENU_IMAGES[section.title] || 'coffee.jpg')}" alt="${escapeAttr(item[0])}飲品示意圖" loading="lazy"><span class="drink-menu-card-category">${escapeHtml(section.title)}</span></div><div class="cake-product-meta"><div class="cake-product-title-link"><span class="cake-product-title">${escapeHtml(item[0])}</span><span class="drink-menu-card-english">${escapeHtml(item[1])}</span></div></div></article>`;
  })).join('');
  return `<section class="coffee-page"><section class="coffee-menu-section"><img class="coffee-page-icon" src="/assets/images/icon-coffee.png" alt="" aria-hidden="true"><div class="drink-menu-grid">${cards}</div></section></section><script src="/assets/drink-menu-modal.js"></script>`;
}

function customerPageContent(route = "login") {
  const isDashboard = route === "dashboard";
  const loginHidden = isDashboard ? " hidden" : "";
  const appHidden = isDashboard ? "" : " hidden";
  return `<section class="account-shell" data-store-account data-account-route="${route}">
    <div class="account-layout">
      <aside class="account-sidebar">
        <a class="account-brand" href="/"><span class="account-brand-mark">S</span><span><b>森森點心坊</b><small>會員中心</small></span></a>
        <div class="account-user-card"><span class="account-avatar">S</span><div><strong data-sidebar-user>會員您好</strong><small>SenSen Bakery</small></div></div>
        <button class="account-menu-toggle" type="button" aria-expanded="false" aria-controls="account-navigation"><span class="account-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>會員選單</span><b>⌄</b></button>
        <nav class="account-nav" id="account-navigation" aria-label="會員功能">
          <a class="account-side-link" href="/"><span>⌂</span>首頁</a>
          <a class="account-side-link" href="/產品介紹/生日蛋糕-下方有dm供下載-264/"><span>▦</span>產品介紹</a>
          <a class="account-side-link" href="/聯絡我們/"><span>◎</span>聯絡我們</a>
          <span class="account-side-divider"></span>
          <button type="button" data-account-tab="overview" class="active"><span>▦</span>帳戶總覽</button>
          <button type="button" data-account-tab="orders"><span>☷</span>我的訂單 <em data-sidebar-order-count></em></button>
          <button type="button" data-account-tab="address"><span>⌖</span>收件地址</button>
          <button type="button" data-account-tab="profile"><span>●</span>會員資料</button>
          <a class="account-side-link account-mobile-store-link" href="/"><span>↩</span>返回森森官網</a>
          <button type="button" class="account-mobile-logout" data-account-logout><span>↪</span>登出</button>
        </nav>
        <div class="account-sidebar-footer"><a href="/">返回森森官網</a><button type="button" data-account-logout>登出</button></div>
      </aside>
      <div class="account-content">
        <div class="account-topbar"><span>會員中心 / <b data-account-title>帳戶總覽</b></span></div>
        <div id="account-message" role="status"></div>
        <div data-account-panel="login" class="account-auth-grid"${loginHidden}>
          <section class="account-login-card"><h1><span></span>Login</h1><form class="account-form" data-account-login><label>Username or email address <b>*</b><input name="login" type="text" required autocomplete="username"></label><label>Password <b>*</b><input name="password" type="password" required autocomplete="current-password"></label><div class="account-auth-actions"><button class="save-btn" type="submit">Log in</button></div></form></section>
          <section class="account-login-card"><h1><span></span>Register</h1><form class="account-form" data-account-register><label>Full Name <b>*</b><input name="name" required autocomplete="name"></label><label>Email address <b>*</b><input name="email" type="email" required autocomplete="email"></label><label>Phone<input name="phone" type="tel" autocomplete="tel"></label><label>Password <b>*</b><input name="password" type="password" minlength="6" required autocomplete="new-password"></label><div class="account-auth-actions"><button class="save-btn" type="submit">Register</button></div></form></section>
        </div>
        <div data-account-panel="app"${appHidden}><div class="account-heading"><p class="account-kicker">MEMBER DASHBOARD</p><h1>歡迎回來，<span data-user-name></span></h1><p class="account-desc" data-user-email></p></div><section class="content-section account-overview-section" data-account-section="overview"><div class="section-title"><div><p class="account-kicker">ACTIVITY</p><h2>Recent Orders</h2></div><button type="button" data-account-tab-link="orders">查看全部訂單</button></div><div data-account-orders></div></section><div class="account-lower-grid"><section class="content-section account-preview-card"><h2>Saved Address</h2><p data-address-preview>尚未儲存收件地址。</p><button type="button" data-account-tab-link="address">編輯地址</button></section><section class="content-section account-preview-card"><h2>物流 Shipping</h2><p>查看取貨日期與訂單物流狀態。</p><button type="button" data-account-tab-link="orders">查看訂單</button></section></div><section class="content-section" data-account-section="profile" hidden><div class="section-title"><div><p class="account-kicker">ACCOUNT</p><h2>會員資料</h2></div></div><form class="account-form" data-profile-form><label>姓名<input name="name" required></label><label>電子信箱<input name="email" type="email" required></label><label>電話<input name="phone"></label><button class="save-btn" type="submit">儲存資料</button></form></section><section class="content-section" data-account-section="address" hidden><div class="section-title"><div><p class="account-kicker">DELIVERY</p><h2>收件地址</h2></div></div><form class="account-form" data-address-form><label>收件人<input name="fullName"></label><label>電話<input name="phone"></label><label>地址<input name="address"></label><label>城市<input name="city"></label><label>郵遞區號<input name="zip"></label><button class="save-btn" type="submit">儲存地址</button></form></section><section class="content-section" data-account-section="orders" hidden><div class="section-title"><div><p class="account-kicker">HISTORY</p><h2>我的訂單</h2></div></div><div data-account-orders-full></div></section></div>
      </div>
    </div>
  </section>
  <script>${accountScript()}</script>`;
}

function cartPageContent() {
  return `<section class="store-page"><div class="store-page-card"><p class="eyebrow">SENSEN BAKERY</p><h1>購物車</h1><div data-full-cart><p>載入中…</p></div><div class="store-page-actions"><a class="button" href="/產品介紹/生日蛋糕-下方有dm供下載-264/">繼續選購</a><a class="button" href="/customer/admin/">前往會員中心</a></div></div></section>${cartPageScript()}`;
}

function checkoutPageContent() {
  return `<section class="checkout-hero"><div class="checkout-hero-inner"><p class="eyebrow">SENSEN BAKERY</p><h1>Checkout</h1><p>完成森森點心坊的訂單。</p></div></section>
    <section class="checkout-layout" data-checkout-page>
      <div class="checkout-main">
        <section class="checkout-details-panel"><p class="eyebrow">ORDER INFORMATION</p><h2>Your Details</h2><div class="checkout-form-grid">
          <label class="checkout-field">姓名 *<input data-checkout-name autocomplete="name" required placeholder="請輸入姓名"></label><label class="checkout-field">電子信箱 *<input data-checkout-email type="email" autocomplete="email" required placeholder="請輸入電子信箱"></label><label class="checkout-field">聯絡電話 *<input data-checkout-phone type="tel" autocomplete="tel" required placeholder="請輸入聯絡電話"></label><label class="checkout-field">物流方式 *<select data-checkout-shipping><option value="pickup">門市自取（免運）</option><option value="home">宅配（$120）</option><option value="frozen">冷凍宅配（$240）</option></select></label><label class="checkout-field checkout-field-wide">國家／地區 *<select data-checkout-country><option>Taiwan</option></select></label>
          <label class="checkout-field checkout-field-wide">地址<input data-checkout-address autocomplete="street-address" placeholder="請輸入地址"></label><div class="checkout-delivery-fields checkout-field-wide" data-checkout-delivery-fields hidden><label class="checkout-field">縣市／區域<input data-checkout-city autocomplete="address-level2" placeholder="例如：台北市"></label><label class="checkout-field">郵遞區號<input data-checkout-zip autocomplete="postal-code" placeholder="郵遞區號"></label></div>
          <label class="checkout-field checkout-field-wide">給店家的備註<textarea data-checkout-note rows="4" placeholder="例如：蛋糕牌文字、配送提醒"></textarea></label>
        </div><p class="checkout-account-hint">需要修改姓名、地址或電話？請返回會員中心的 Account Details / Addresses 更新。</p><p class="checkout-form-message" data-checkout-submit-message role="status"></p><button class="checkout-submit checkout-submit-mobile" type="button" data-checkout-submit>確認訂單</button></section>
      </div>
      <aside class="checkout-sidebar"><section class="checkout-order-card"><div class="checkout-card-heading"><h2>Your Order</h2><a href="/cart/">✎ 編輯購物車</a></div><div class="checkout-coupon"><input data-checkout-coupon type="text" placeholder="優惠碼" autocomplete="off"><button type="button" data-checkout-apply-coupon>套用優惠碼</button></div><p class="checkout-form-message" data-checkout-quote-message role="status"></p><div class="checkout-items" data-checkout-items><p>載入中…</p></div><div class="checkout-pickup-card"><span class="checkout-calendar" aria-hidden="true">▣</span><div><span>Pickup date</span><strong data-checkout-pickup-label>載入中…</strong></div><input data-checkout-pickup type="date" required aria-label="取貨／配送日期"></div><div class="checkout-summary"><div><span>商品小計</span><strong data-checkout-subtotal>$0.00</strong></div><div><span>運費</span><strong data-checkout-shipping-fee>$0.00</strong></div><div data-checkout-discount-row hidden><span>折扣</span><strong data-checkout-discount>-$0.00</strong></div><div class="checkout-total"><span>Total</span><strong data-checkout-total>$0.00</strong></div></div><section class="checkout-payment-note"><h3>Payment</h3><strong>Secure payment</strong><p>付款資料由金流服務商處理，森森點心坊不會儲存信用卡敏感資料。</p><p>目前會先建立訂單；正式啟用金流服務後，付款方式會在此安全完成。</p></section><p class="checkout-form-message" data-checkout-submit-message-secondary role="status"></p><button class="checkout-submit" type="button" data-checkout-submit>確認訂單</button><a class="checkout-back" href="/cart/">返回購物車</a></section></aside>
    </section>${checkoutPageScript()}`;
}

function ordersPageContent() {
  return `<section class="store-page"><div class="store-page-card"><p class="eyebrow">SENSEN BAKERY</p><h1>我的訂單</h1><div data-orders-page><p>載入中…</p></div><a class="button" href="/customer/admin/">返回會員中心</a></div></section>${ordersPageScript()}`;
}

function accountScript() {
  return `(() => {
    const api = async (path, options = {}) => { const response = await fetch(path, { ...options, credentials: "include", headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "操作失敗。"); return data; };
    const root = document.querySelector("[data-store-account]"), message = document.querySelector("#account-message"), login = document.querySelector("[data-account-panel=login]"), app = document.querySelector("[data-account-panel=app]"), loginForm = document.querySelector("[data-account-login]"), registerForm = document.querySelector("[data-account-register]"), profileForm = document.querySelector("[data-profile-form]"), addressForm = document.querySelector("[data-address-form]"); let user = null, orders = [];
    const showMessage = (text, error = false) => { message.textContent = text || ""; message.className = text ? (error ? "account-error" : "account-success") : ""; };
    const escapeHtml = value => String(value ?? "").replace(/[&<>\"']/g, char => char === "&" ? "&amp;" : char === "<" ? "&lt;" : char === ">" ? "&gt;" : char === String.fromCharCode(34) ? "&quot;" : "&#39;");
    const statusLabels = { pending: "待付款", processing: "處理中", shipped: "已出貨", completed: "已完成", cancelled: "已取消", created: "已建立" };
    const shippingLabels = { pickup: "門市自取", home: "宅配", frozen: "冷凍宅配" };
    const formatOrderDate = value => value ? String(value).replace("T", " ").slice(0, 16) : "";
    const renderOrders = target => { target.innerHTML = orders.length ? orders.map(order => { const details = [shippingLabels[order.shippingMethod] || order.shippingMethod || "", formatOrderDate(order.fulfillmentDate) ? "日期：" + formatOrderDate(order.fulfillmentDate) : "", order.trackingNumber ? "物流單號：" + order.trackingNumber : ""].filter(Boolean); return '<div class="order-row"><div class="order-row-main"><b>#' + escapeHtml(String(order.id).slice(0, 12)) + '</b>' + (details.length ? '<small class="order-details">' + escapeHtml(details.join(" · ")) + '</small>' : '') + '</div><span class="status">' + escapeHtml(statusLabels[order.status] || order.status || "已建立") + '</span><strong>$' + Number(order.total || 0).toFixed(2) + '</strong></div>'; }).join("") : "<p>目前沒有訂單。</p>"; };
    const render = data => { user = data.user; orders = data.orders || []; login.hidden = true; app.hidden = false; document.querySelector("[data-user-name]").textContent = user.name || "會員"; document.querySelector("[data-sidebar-user]").textContent = user.name || "會員您好"; document.querySelector("[data-user-email]").textContent = user.email || ""; document.querySelector("[data-sidebar-order-count]").textContent = orders.length ? "(" + orders.length + ")" : ""; profileForm.elements.name.value = user.name || ""; profileForm.elements.email.value = user.email || ""; profileForm.elements.phone.value = user.phone || ""; const address = data.address || {}; ["fullName", "phone", "address", "city", "zip"].forEach(key => { addressForm.elements[key].value = address[key] || ""; }); const addressText = [address.address, address.city, address.zip].filter(Boolean).join("，"); document.querySelector("[data-address-preview]").textContent = addressText || "尚未儲存收件地址。"; renderOrders(document.querySelector("[data-account-orders]")); renderOrders(document.querySelector("[data-account-orders-full]")); api("/api/cart").then(cart => { const count = (cart.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0); document.querySelectorAll("[data-cart-count]").forEach(item => { item.textContent = count; }); }); };
    const load = async (showError = false) => { try { const me = await api("/api/me"); const ordersData = await api("/api/orders"); render({ ...me, ...ordersData }); return true; } catch (error) { login.hidden = false; app.hidden = true; if (showError) showMessage(error.message, true); return false; } };
    loginForm.addEventListener("submit", async event => { event.preventDefault(); const form = new FormData(event.currentTarget), button = event.currentTarget.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "登入中…"; showMessage(""); try { await api("/api/login", { method: "POST", body: JSON.stringify({ login: String(form.get("login") || "").trim(), password: form.get("password") }) }); window.location.assign("/customer/admin/backup/"); } catch (error) { showMessage(error.message, true); button.disabled = false; button.textContent = "Log in"; } });
    registerForm.addEventListener("submit", async event => { event.preventDefault(); const form = new FormData(event.currentTarget), button = event.currentTarget.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "註冊中…"; showMessage(""); try { await api("/api/register", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) }); window.location.assign("/customer/admin/backup/"); } catch (error) { showMessage(error.message, true); button.disabled = false; button.textContent = "Register"; } });
    profileForm.addEventListener("submit", async event => { event.preventDefault(); try { const data = await api("/api/me", { method: "PUT", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); showMessage("會員資料已更新。"); user = data.user; document.querySelector("[data-user-name]").textContent = user.name || "會員"; document.querySelector("[data-sidebar-user]").textContent = user.name || "會員您好"; } catch (error) { showMessage(error.message, true); } });
    addressForm.addEventListener("submit", async event => { event.preventDefault(); try { await api("/api/address", { method: "PUT", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); showMessage("收件地址已更新。"); } catch (error) { showMessage(error.message, true); } });
    const switchTab = tab => { document.querySelectorAll("[data-account-tab]").forEach(item => item.classList.toggle("active", item.dataset.accountTab === tab)); document.querySelectorAll("[data-account-section]").forEach(section => { section.hidden = section.dataset.accountSection !== tab; }); const labels = { overview: "帳戶總覽", profile: "會員資料", address: "收件地址", orders: "我的訂單" }; document.querySelector("[data-account-title]").textContent = labels[tab] || labels.overview; };
    document.querySelectorAll("[data-account-tab], [data-account-tab-link]").forEach(button => button.addEventListener("click", () => switchTab(button.dataset.accountTab || button.dataset.accountTabLink)));
    const accountMenuToggle = document.querySelector(".account-menu-toggle"), accountNav = document.querySelector(".account-nav");
    accountMenuToggle?.addEventListener("click", () => { const isOpen = accountMenuToggle.getAttribute("aria-expanded") === "true"; accountMenuToggle.setAttribute("aria-expanded", String(!isOpen)); accountNav.classList.toggle("is-open", !isOpen); });
    document.querySelectorAll(".account-nav [data-account-tab]").forEach(button => button.addEventListener("click", () => { if (window.matchMedia("(max-width: 760px)").matches) { accountMenuToggle.setAttribute("aria-expanded", "false"); accountNav.classList.remove("is-open"); } }));
    document.querySelectorAll("[data-account-logout]").forEach(button => button.addEventListener("click", async () => { button.disabled = true; await api("/api/logout", { method: "POST" }); window.location.assign("/customer/admin/"); })); if (root.dataset.accountRoute === "dashboard") load(true); else api("/api/me").then(() => window.location.assign("/customer/admin/backup/")).catch(() => {});
  })();`;
}

function cartPageScript() {
  return '<script src="/assets/cart-page.js"></script>';
}

function checkoutPageScript() {
  return '<script src="/assets/checkout-page.js"></script>';
}

function ordersPageScript() {
  return '<script src="/assets/orders-page.js"></script>';
}

function contactPageContent() {
  return `<section class="contact-page">
    <div class="contact-page-hero">
      <h1>連絡我們</h1>
      <p>歡迎您提供寶貴的建議，謝謝您!</p>
    </div>
    <div class="contact-page-card">
      <img class="contact-page-wheat" src="/assets/images/icon-wheat.png" alt="" aria-hidden="true">
      <form class="contact-page-form" data-contact-form>
        <div class="contact-page-fields">
          <label><span>您的姓名</span><input name="name" required autocomplete="name"></label>
          <label><span>電子信箱</span><input name="email" type="email" required autocomplete="email"></label>
        </div>
        <label class="contact-page-wide"><span>-請選擇問題類型-</span><select name="subject" required>
          <option value="">-請選擇問題類型-</option>
          <option value="商品相關問題">商品相關問題</option>
          <option value="門市相關問題">門市相關問題</option>
          <option value="訂購與配送">訂購與配送</option>
          <option value="其他">其他</option>
        </select></label>
        <label class="contact-page-wide"><span>留言內容</span><textarea name="message" rows="8" required></textarea></label>
        <p class="contact-page-message" data-contact-message role="status" aria-live="polite"></p>
        <button type="submit">送出留言 <span aria-hidden="true">➜</span></button>
      </form>
    </div>
    <div class="contact-page-slogan">
      <p>麵包/蛋糕/彌月/餐盒/酒會</p>
      <img src="/assets/images/text-slogn.png" alt="帶給你嘴角上揚的幸福">
    </div>
    <script>
    (() => {
      const form = document.querySelector('[data-contact-form]');
      if (!form) return;
      const message = form.querySelector('[data-contact-message]');
      const button = form.querySelector('button[type="submit"]');
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        button.disabled = true;
        message.textContent = '送出中…';
        const value = name => form.elements[name]?.value.trim() || '';
        try {
          const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value('name'), email: value('email'), phone: value('phone'), subject: value('subject'), message: value('message') }) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || '送出失敗，請稍後再試。');
          form.reset();
          message.className = 'contact-page-message is-success';
          message.textContent = data.message || '訊息已送出。';
        } catch (error) {
          message.className = 'contact-page-message is-error';
          message.textContent = error.message;
        } finally {
          button.disabled = false;
        }
      });
    })();
    </script>
  </section>`;
}


const TEA_PARTY_SECTIONS = [
  ["SALTY BREAD", "麵包鹹餐(葷)", ["sandwich.jpg", "party-salty-bread-7.jpg", "party-salty-bread-2.jpg", "party-salty-bread-1.jpg", "party-salty-bread-10.jpg", "party-salty-bread-9.jpg", "party-salty-bread-12.jpg", "cheese-3.jpg", "party-salty-bread-3.jpg", "taro-2.jpg", "lemon-lemon-chicken-burger.jpg", "chicken-burger.jpg", "party-salty-bread-8.jpg", "party-salty-bread-5.jpg", "party-sweet-bread-1.jpg", "pork-floss-pastry.png", "parmesan-sausage.png"]],
  ["SWEET BREAD", "麵包甜餐(素)", ["fruit-sandwich.jpg", "party-sweet-bread-5.jpg", "taro-sandwich.jpg", "party-sweet-bread-4.jpg", "flat-croissant.jpg", "italian-mini-bun.jpg", "truffle-milk-bun.png", "custard.jpg", "wine-longan.png", "pine-truffle.jpg", "taro-custard.jpg"]],
  ["DESSERTS AND CAKES", "西點蛋糕(素)", ["party-cake-16.jpg", "party-cake-19.jpg", "party-cake-20.jpg", "party-cake-21.jpg", "party-cake-1.jpg", "party-cake-2.jpg", "party-cake-3.jpg", "party-cake-4.jpg", "party-cake-5.jpg", "party-cake-6.jpg", "party-cake-9.jpg", "party-cake-10.jpg", "party-cake-11.jpg", "party-cake-13.jpg", "party-cake-14.jpg", "taro-daifuku.jpg", "taro-fragrant-puff-puff.jpg", "mixed-mixed-cookies.jpg", "fruit-puff.jpg", "purple-taro-orchid-cake.jpg", "day-layer-cake.jpg", "lemon-grandma.png", "hawaiian.png", "peanut-mochi.png", "belgian-chocolate.jpg", "cheese-custard.jpg", "palmiers-3.jpg", "brown-sugar-jelly.jpg"]],
  ["FRIED FOOD & OTHER", "炸物小點類(葷)", ["buffet-snacks-3.jpg", "buffet-snacks-1.jpg", "buffet-snacks-2.jpg"]],
  ["FRESH FRUITS", "水果(素)", ["party-salty-fruit.jpg"]],
];

function teaPartyContent() {
  const sectionHtml = TEA_PARTY_SECTIONS.map(([eyebrow, title, images]) => '<section class="tea-party-category"><div class="tea-party-category-heading"><p>' + escapeHtml(eyebrow) + '</p><h2>' + escapeHtml(title) + '</h2></div><div class="tea-party-product-grid">' + images.map((image) => '<div class="tea-party-product"><img src="/assets/images/' + escapeAttr(image) + '" alt="' + escapeAttr(title) + '餐點" loading="lazy"></div>').join("") + '</div></section>').join("");
  const content = `<section class="tea-party-page">
    <section class="tea-party-hero">
      <div class="tea-party-hero-copy">
        <img class="tea-party-hero-icon" src="/assets/images/icon-cake2.png" alt="" aria-hidden="true">
        <h1>酒會與茶會點心</h1>
        <p>不管是公司會議或是學校舉辦活動，實惠價格搭配可口精緻茶點，<br>超高CP值，森森是您最佳的選擇!</p>
        <span class="tea-party-hero-rule" aria-hidden="true"></span>
        <div class="tea-party-hero-actions">
          <a class="tea-party-menu-download" href="https://docs.google.com/spreadsheets/d/1KrLWkMaNHhZr7AmkgCZ4WQcbLzb99YAB/edit?gid=703529566#gid=703529566" target="_blank" rel="noreferrer"><span class="tea-party-menu-book" aria-hidden="true"></span><span>茶會菜單下載</span></a>
          <a class="catering-inquiry-link" href="#tea-party-inquiry">茶會詢價</a>
        </div>
      </div>
    </section>
    ${sectionHtml}
    <section class="tea-party-note"><span class="tea-party-note-icon" aria-hidden="true"></span><p>※ <strong>完整菜單請下載最上方檔案連結</strong>，圖片為參考圖，產品請以實物為主。<strong>菜色照片會陸續更新。</strong></p></section>
    ${inquirySection({ id: "tea-party-inquiry", title: "茶會詢價專區", subject: "茶會詢價" })}
    <section class="tea-party-stores"><div class="tea-party-stores-panel"><a class="tea-party-store" href="https://goo.gl/maps/3oxsrUzT22G2" target="_blank" rel="noreferrer"><span class="tea-party-store-line" aria-hidden="true"></span><strong>澄和店</strong><span>三民區澄和路78號</span><span>07-3816662</span><span class="tea-party-store-map" aria-hidden="true">Google Map <span>→</span></span></a><a class="tea-party-store" href="https://goo.gl/maps/JptBgTTquh92" target="_blank" rel="noreferrer"><span class="tea-party-store-line" aria-hidden="true"></span><strong>新富店</strong><span>鳳山區新富路276號</span><span>07-7675992</span><span class="tea-party-store-map" aria-hidden="true">Google Map <span>→</span></span></a><a class="tea-party-store" href="https://goo.gl/maps/Wea9v9dtqCs" target="_blank" rel="noreferrer"><span class="tea-party-store-line" aria-hidden="true"></span><strong>博愛店</strong><span>鳳山區博愛路219號</span><span>07-7993070</span><span class="tea-party-store-map" aria-hidden="true">Google Map <span>→</span></span></a><a class="tea-party-store" href="https://goo.gl/maps/NpDLVEYQHAk" target="_blank" rel="noreferrer"><span class="tea-party-store-line" aria-hidden="true"></span><strong>文龍店</strong><span>鳳山區文龍東路336號</span><span>07-7335812</span><span class="tea-party-store-map" aria-hidden="true">Google Map <span>→</span></span></a></div></section>
    ${inquiryScript()}
  </section>`;
  return content
    .replaceAll('tea-party-stores', 'catering-stores')
    .replaceAll('tea-party-store', 'catering-store')
    .replaceAll('tea-party-store-line', 'catering-store-line')
    .replaceAll('tea-party-store-map', 'catering-store-map');
}


function tasteApplyContent() {
  return "<section class=\"taste-apply-page\">\n  <section class=\"taste-apply-hero\">\n    <div class=\"taste-apply-hero-copy\"><h1>彌月試吃申請</h1><p>填完表單後系統會寄信，收到信才算「申請成功」，我們不會電話通知。<br>(如未收到請確認填寫是否正確)</p></div>\n    <div class=\"taste-apply-card\">\n      <img class=\"taste-apply-baby\" src=\"/assets/images/icon-baby.png\" alt=\"\">\n      <form data-taste-apply>\n        <div class=\"taste-apply-field taste-apply-field-wide\"><label><span>*</span> 媽咪姓名<input name=\"name\" required autocomplete=\"name\"></label></div>\n        <div class=\"taste-apply-field taste-apply-field-wide\"><label><span>*</span> 電子信箱<input name=\"email\" type=\"email\" required autocomplete=\"email\"></label></div>\n        <div class=\"taste-apply-field\"><label><span>*</span> 連絡電話<input name=\"phone\" required autocomplete=\"tel\"></label><small>請確認電話是否有填寫正確唷!</small></div>\n        <div class=\"taste-apply-field\"><label>備用電話<input name=\"alternatePhone\" autocomplete=\"tel\"></label></div>\n        <div class=\"taste-apply-field taste-apply-field-wide\"><label>方便聯絡時間<select name=\"contactTime\"><option value=\"\">請選擇時段</option><option>早｜10:00~13:00</option><option>中｜14:00~18:00</option><option>晚｜18:30~20:00</option></select></label></div>\n        <fieldset class=\"taste-apply-choice\"><legend><span>*</span> 寶寶性別</legend><label><input type=\"radio\" name=\"babyGender\" value=\"男生Boy\" required> 男生Boy</label><label><input type=\"radio\" name=\"babyGender\" value=\"女生Girl\"> 女生Girl</label></fieldset>\n        <fieldset class=\"taste-apply-choice\"><legend><span>*</span> 是否已生產</legend><label><input type=\"radio\" name=\"produced\" value=\"是\" required> 是</label><label><input type=\"radio\" name=\"produced\" value=\"否\"> 否</label></fieldset>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-produced=\"yes\"><label><span>*</span> 請輸入寶寶的滿月日期<input name=\"fullMoonDate\" type=\"date\"></label></div>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-produced=\"yes\"><label><span>*</span> 生產醫院<input name=\"birthHospital\"></label></div>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-produced=\"no\"><label><span>*</span> 請輸入您的預產期<input name=\"expectedDate\" type=\"date\"></label></div>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-produced=\"no\"><label><span>*</span> 產檢醫院<input name=\"prenatalHospital\"></label></div>\n        <fieldset class=\"taste-apply-choice taste-apply-field-wide\"><legend><span>*</span> 彌月試吃領取方式</legend><label><input type=\"radio\" name=\"deliveryMethod\" value=\"自取\" required> 自取(16:00~22:00自取)</label><label><input type=\"radio\" name=\"deliveryMethod\" value=\"宅配\"> 宅配</label></fieldset>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-delivery=\"pickup\"><label><span>*</span> 自取門市<select name=\"pickupStore\"><option value=\"\">請選取門市</option><option>澄和店｜高雄市三民區澄和路78號</option><option>新富店｜高雄市鳳山區新富路276號</option><option>博愛店｜高雄市鳳山區博愛路219號</option><option>文龍店｜高雄市鳳山區文龍東路336號</option></select></label></div>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-delivery=\"pickup\"><label><span>*</span> 請選擇自取日期<input name=\"pickupDate\" type=\"date\"></label><small>星期一、星期六、星期日不開放自取；領取時段為 16:00~22:00。</small></div>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-delivery=\"delivery\"><label><span>*</span> 宅配地址<input name=\"deliveryAddress\" autocomplete=\"street-address\"></label><small>宅配費用 160 元，將於配送時收取。</small></div>\n        <div class=\"taste-apply-dependent taste-apply-field-wide\" data-delivery=\"delivery\"><label><span>*</span> 請選擇到貨日期<input name=\"deliveryDate\" type=\"date\"></label><small>星期一、星期六、星期日暫停配送；出貨前會與您電話確認。</small></div>\n        <p class=\"taste-apply-message\" data-taste-apply-message role=\"status\"></p>\n        <button class=\"taste-apply-submit\" type=\"submit\">送出申請 <span aria-hidden=\"true\">➜</span></button>\n      </form>\n    </div>\n  </section>\n  <section class=\"taste-apply-notes\"><div class=\"taste-apply-notes-inner\"><h2>注意事項:</h2><ol>\n    <li><strong>當天申請無法當天領取，截單日為前一天17:00前。</strong></li>\n    <li>只要滿35週(含)以上或已生產的媽媽均可申請。</li>\n    <li>彌月試吃提供品項：5塊切片蛋糕＋一塊波士頓派，一共六塊及一本彌月目錄＆專員名片。</li>\n    <li>填寫完成系統會<strong><u>自動發送信件至您的mail屆時才算申請成功。</u></strong>(如未收到mail請確認填寫是否正確)</li>\n    <li>門市自取免費；宅配寄送費用160元，貨到付款。</li>\n    <li>如欲<strong>取消申請或改期，請於出貨前2日</strong>私訊我們FB粉專或來信告知。</li>\n    <li>預約試吃活動者，同意森森因產品推廣、活動贈獎等目的，運用所提供之基本資料或與活動參與繫。</li>\n  </ol></div></section>\n  <section class=\"taste-apply-slogan\"><p>麵包/蛋糕/彌月/餐盒/酒會</p><small>帶給你嘴角上揚的幸福</small></section>\n</section>\n<script>\n(() => {\n  const form = document.querySelector('[data-taste-apply]');\n  if (!form) return;\n  const message = form.querySelector('[data-taste-apply-message]');\n  const producedGroups = [...form.querySelectorAll('[data-produced]')];\n  const deliveryGroups = [...form.querySelectorAll('[data-delivery]')];\n  const updateRequired = (groups, active) => groups.forEach((group) => {\n    group.hidden = active === undefined || (group.dataset.produced ? group.dataset.produced !== active : group.dataset.delivery !== active);\n    group.querySelectorAll('input, select').forEach((input) => { input.required = !group.hidden; if (group.hidden) input.value = ''; });\n  });\n  const update = () => {\n    const produced = form.querySelector('[name=\"produced\"]:checked')?.value;\n    const delivery = form.querySelector('[name=\"deliveryMethod\"]:checked')?.value;\n    updateRequired(producedGroups, produced === undefined ? undefined : (produced === '是' ? 'yes' : 'no'));\n    updateRequired(deliveryGroups, delivery === undefined ? undefined : (delivery === '自取' ? 'pickup' : 'delivery'));\n  };\n  form.addEventListener('change', update); update();\n  form.addEventListener('submit', async (event) => {\n    event.preventDefault();\n    if (!form.reportValidity()) return;\n    const data = new FormData(form), value = (name) => String(data.get(name) || '').trim();\n    const button = form.querySelector('button[type=\"submit\"]');\n    button.disabled = true; message.className = 'taste-apply-message is-loading'; message.textContent = '送出中，請稍候…';\n    const details = ['備用電話：' + value('alternatePhone'), '方便聯絡時間：' + value('contactTime'), '寶寶性別：' + value('babyGender'), '是否已生產：' + value('produced'), '滿月日期：' + value('fullMoonDate'), '生產醫院：' + value('birthHospital'), '預產期：' + value('expectedDate'), '產檢醫院：' + value('prenatalHospital'), '領取方式：' + value('deliveryMethod'), '自取門市：' + value('pickupStore'), '自取日期：' + value('pickupDate'), '宅配地址：' + value('deliveryAddress'), '到貨日期：' + value('deliveryDate')].filter((item) => !item.endsWith('：')).join('\\n');\n    try {\n      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value('name'), email: value('email'), phone: value('phone'), subject: '彌月試吃申請', message: details }) });\n      const result = await response.json().catch(() => ({}));\n      if (!response.ok) throw new Error(result.error || '目前無法送出申請，請稍後再試。');\n      form.reset(); update(); message.className = 'taste-apply-message is-success'; message.textContent = '申請已送出，請至信箱確認申請成功通知。';\n    } catch (error) { message.className = 'taste-apply-message is-error'; message.textContent = error.message; }\n    finally { button.disabled = false; }\n  });\n})();\n</script>";
}

const originalTasteApplyContent = tasteApplyContent;
tasteApplyContent = () => originalTasteApplyContent()
  .replace('<small>帶給你嘴角上揚的幸福</small>', '<img class="taste-apply-slogan-image" src="/assets/images/text-slogn-w.png" alt="帶給您嘴角上揚的幸福">');

function faqContent() {
  return "<section class=\"faq-page\">\n  <div class=\"faq-wheat\" aria-hidden=\"true\"><img src=\"/assets/images/icon-wheat.png\" alt=\"\"></div>\n  <div class=\"faq-groups\">\n    <section class=\"faq-group\">\n      <div class=\"faq-group-heading\"><h2>彌月諮詢&amp;試吃服務</h2><span aria-hidden=\"true\"></span></div>\n      <div class=\"faq-list\">\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-1-1\"><span class=\"faq-number\">1</span><span class=\"faq-question-title\">門市諮詢、試吃服務</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-1-1\" class=\"faq-answer\" hidden>產前產後均可申請。滿35周(含)以上的媽媽就可以申請囉！可至門市洽詢，或來電索取試吃：07-7966959，也可利用 <a href=\"/%e9%a0%82%e5%ae%b6%e5%bd%8c%e6%9c%88/taste_apply/\">線上申請</a> 唷！(或 <a href=\"https://www.facebook.com/sensenbakery/\" target=\"_blank\" rel=\"noreferrer\">粉專FB</a>)</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-1-2\"><span class=\"faq-number\">2</span><span class=\"faq-question-title\">禮盒的搭配組合</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-1-2\" class=\"faq-answer\" hidden>彌月禮盒內容物皆可客製任選、搭配。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-1-3\"><span class=\"faq-number\">3</span><span class=\"faq-question-title\">訂購及更改</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-1-3\" class=\"faq-answer\" hidden>本公司全程新鮮生產，請於交貨日前七日訂購／確認。若欲追加／更改訂單，請於出貨前2日完成變更手續，逾期恕本公司保有不接受改單之權利。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-1-4\"><span class=\"faq-number\">4</span><span class=\"faq-question-title\">訂購優惠</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-1-4\" class=\"faq-answer\" hidden>訂購滿30盒以上享有特價優惠，不再與其他折扣或優惠辦法重覆使用。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-1-5\"><span class=\"faq-number\">5</span><span class=\"faq-question-title\">森森保留的變更權利</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-1-5\" class=\"faq-answer\" hidden>森森保留價格、產品組合、禮盒設計等變更之權利，型錄圖片僅供參考，產品以實物為準。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-1-6\"><span class=\"faq-number\">6</span><span class=\"faq-question-title\">價格變動</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-1-6\" class=\"faq-answer\" hidden>禮盒組合的定價，依您所選擇之內搭商品價格為準。如遇商品內容、價格及產品組合變動，恕不另行通知。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-1-7\"><span class=\"faq-number\">7</span><span class=\"faq-question-title\">宅配服務</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-1-7\" class=\"faq-answer\" hidden>本公司有代客宅配服務，全程低溫冷藏宅配。蛋糕均為特價品，運費需另計。</div></article>\n      </div>\n    </section>\n    <section class=\"faq-group faq-group-pattern\">\n      <div class=\"faq-group-heading\"><h2>配送取貨問題</h2><span aria-hidden=\"true\"></span></div>\n      <div class=\"faq-list\">\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-2-1\"><span class=\"faq-number\">1</span><span class=\"faq-question-title\">貨運寄送範圍有含離島嗎?</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-2-1\" class=\"faq-answer\" hidden>森森與統一宅急便(黑貓)配合運送。台灣本島皆可運送，離島地區除東引島以外其他皆可運送。提醒您，如配送外島，易碎及易變形商品須自行承擔破損風險。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-2-2\"><span class=\"faq-number\">2</span><span class=\"faq-question-title\">可指定到貨日期嗎？</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-2-2\" class=\"faq-answer\" hidden>若欲指定到貨日期請提早訂購，並於接洽的專員註明到貨日期。若不確定該指定日期是否可如期到貨，請洽詢專人服務：07-7966959。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-2-3\"><span class=\"faq-number\">3</span><span class=\"faq-question-title\">是否可指定到貨時段</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-2-3\" class=\"faq-answer\" hidden>我們有三個送貨的時段：9:00、12:00、14:00。</div></article>\n      </div>\n    </section>\n    <section class=\"faq-group\">\n      <div class=\"faq-group-heading\"><h2>商品相關問題</h2><span aria-hidden=\"true\"></span></div>\n      <div class=\"faq-list\">\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-3-1\"><span class=\"faq-number\">1</span><span class=\"faq-question-title\">預定蛋糕需要支付全額嗎？</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-3-1\" class=\"faq-answer\" hidden>一般節慶蛋糕不強制全額支付，可接受先支付3成訂金，領取蛋糕當日再結清餘額，發票日期為領取蛋糕當日。<br><br>而活動期間，例如：母親節蛋糕、父親節蛋糕，因檔期折扣因素，提早預購有優惠，需先結清所有款項。</div></article>\n        <article class=\"faq-item\"><button type=\"button\" aria-expanded=\"false\" aria-controls=\"faq-3-2\"><span class=\"faq-number\">2</span><span class=\"faq-question-title\">蛋糕可以離開冷藏多久？可以保存幾天呢？</span><span class=\"faq-plus\" aria-hidden=\"true\">＋</span></button><div id=\"faq-3-2\" class=\"faq-answer\" hidden>建議您蛋糕離開冷藏不要超過半個小時，由於蛋糕都是當日新鮮現做後送至門市，故我們建議您盡量當日食用完畢，口感會比較好。若您未食用完，務必要放置冰箱冷藏，敬請在三日內食用完畢，風味最佳。</div></article>\n      </div>\n    </section>\n  </div>\n</section>\n<script>\n(() => {\n  document.querySelectorAll('.faq-item > button').forEach((button) => {\n    button.addEventListener('click', () => {\n      const answer = document.getElementById(button.getAttribute('aria-controls'));\n      const open = button.getAttribute('aria-expanded') === 'true';\n      button.setAttribute('aria-expanded', String(!open));\n      button.querySelector('.faq-plus').textContent = open ? '＋' : '－';\n      if (answer) answer.hidden = open;\n    });\n  });\n})();\n</script>";
}

const originalFaqContent = faqContent;
faqContent = () => originalFaqContent()
  .replace("彌月諮詢&amp;試吃服務", "彌月諮詢&amp;試<br>吃服務")
  .replace("07-7966959，也可利用", "07-7966959，也<br>可利用")
  .replace("逾期恕本公司", "逾<br>期恕本公司")
  .replace("如配送外島", "如配送<br>外島")
  .replace("請洽詢專人服務", "請洽詢<br>專人服務")
  .replace("發票日期為領取蛋糕當日。", "發票日期為領取蛋糕當<br>日。")
  .replace("盡量當日食用完畢", "盡量當日食用<br>完畢");

function storeInfoContent() {
  const stores = [
    { name: "澄和店", image: "store-1.jpg", address: "高雄市三民區澄和路78號", hours: "8:00~22:00", phone: "07-3816662", map: "https://goo.gl/maps/WQFSnvZ8iP22" },
    { name: "新富店", image: "store-2.jpg", address: "高雄市鳳山區新富路276號", hours: "8:00~22:00", phone: "07-7675992", map: "https://goo.gl/maps/EZFqqQPeh6z" },
    { name: "博愛店", image: "store-3.jpg", address: "高雄市鳳山區博愛路219號", hours: "7:30~22:00", phone: "07-7993070", map: "https://goo.gl/maps/rYLh32wnRdm" },
    { name: "文龍店", image: "store-4.jpg", address: "高雄市鳳山區文龍東路336號", hours: "10:00~22:00", phone: "07-7335812", map: "https://goo.gl/maps/5hoEqTmHsuF2" }
  ];

  const cards = stores.map((store) => '<article class="store-info-card">' +
    '<img class="store-info-card-image" src="/assets/images/' + escapeAttr(store.image) + '" alt="' + escapeAttr(store.name) + '門市" loading="lazy">' +
    '<div class="store-info-card-body"><span class="store-info-marker" aria-hidden="true"></span>' +
      '<h2>' + escapeHtml(store.name) + '</h2>' +
      '<p class="store-info-meta"><span class="store-info-meta-icon store-info-pin" aria-hidden="true"></span>' + escapeHtml(store.address) + '</p>' +
      '<p class="store-info-meta"><span class="store-info-meta-icon store-info-clock" aria-hidden="true"></span>' + escapeHtml(store.hours) + '</p>' +
      '<p class="store-info-meta"><span class="store-info-meta-icon store-info-phone" aria-hidden="true"></span>' + escapeHtml(store.phone) + '</p>' +
      '<a class="store-info-map" href="' + escapeAttr(store.map) + '" target="_blank" rel="noreferrer">Google Map <span aria-hidden="true">→</span></a>' +
    '</div></article>').join("");

  return '<section class="store-info-page">' +
    '<div class="store-info-wheat" aria-hidden="true"><img src="/assets/images/icon-wheat.png" alt=""></div>' +
    '<section class="store-info-stores"><div class="store-info-grid">' + cards + '</div></section>' +
  '</section>';
}
function storefrontProductPathMap() {
  const map = {};
  const normalize = value => String(value || "").replace(/<br\s*\/?\s*>/gi, "").replace(/\s+/g, "").replace(/[（(]季節限定[）)]/g, "（季節限定）");
  CAKE_SECTIONS.forEach(section => [...section.products, ...(section.loadMoreProducts || [])].forEach(([title, likes, image, href]) => { map[normalize(title)] = href; }));
  SOUVENIR_PRODUCTS.forEach(([title, href]) => { map[normalize(title)] = href; });
  return map;
}

function storefrontCatalogContent(view) {
  const classes = view === "cakes" ? "cake-page storefront-catalog-page" : view === "souvenir" ? "souvenir-page storefront-catalog-page" : "product-intro-page storefront-catalog-page";
  const dm = view === "cakes" ? `<section class="cake-dm" id="cake-dm"><a href="https://drive.google.com/file/d/1QW07oLnBIAq4wa2NuMnL7oZZvS-uu0je/view" class="cake-dm-link" target="_blank" rel="noreferrer">生日蛋糕DM下載 <span aria-hidden="true">→</span></a><a class="cake-dm-icon" href="https://drive.google.com/file/d/1QW07oLnBIAq4wa2NuMnL7oZZvS-uu0je/view" target="_blank" rel="noreferrer" aria-label="開啟生日蛋糕 DM"><span class="cake-dm-book" aria-hidden="true"></span></a><p>森森不定期推出各式新品蛋糕，歡迎關注我們的FB。</p></section>` : "";
  return `<section class="${classes}" data-storefront-catalog data-storefront-view="${escapeAttr(view)}" data-product-paths="${escapeAttr(JSON.stringify(storefrontProductPathMap()))}"><p class="storefront-catalog-status" data-storefront-catalog-status>商品資料載入中…</p><div data-storefront-catalog-content></div>${dm}</section><script src="/assets/storefront-products.js?v=20260904-2"></script><script src="/assets/drink-menu-modal.js"></script>`;
}

function cakeRelatedProducts(currentPath) {
  const preferred = [
    ["cake-2024-15.png", "2024-03-21", "OREO", "/product-item/oreo冰淇淋蛋糕-1878"],
    ["cake-2024-14.png", "2024-03-21", "黃色小鴨", "/product-item/黃色小鴨-1876"],
    ["cake-2024-11.png", "2024-03-21", "綠寶石萊思克(季節限定)", "/product-item/綠寶石萊思克季節限定-1870"],
    ["cake-2024-10.png", "2024-03-21", "草莓萊思克(季節限定)", "/product-item/草莓萊思克季節限定-1868"],
    ["dsc03882.png", "2020-03-09", "蜘蛛人", "/product-item/蜘蛛人-1157"],
    ["cake-2020-9.png", "2019-01-07", "北極熊", "/product-item/北極熊"],
  ];
  const allProducts = CAKE_PRODUCT_RECORDS.map((product) => [product.image, "2024-03-21", product.title, product.path]);
  const seen = new Set();
  return [...preferred, ...allProducts].filter(([, , , href]) => {
    const path = localPathFromUrl(new URL(href, SOURCE_ORIGIN).href);
    if (path === currentPath || seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}

function cakeRelatedCarousel(currentPath, headingId) {
  const relatedCards = cakeRelatedProducts(currentPath).map(([image, date, title, href]) => `<article class="emerald-related-card"><a href="${escapeAttr(href)}"><img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy"><span>${escapeHtml(date)}</span><h3>${escapeHtml(title)}</h3><b aria-hidden="true">▪▪&nbsp; 更多</b></a></article>`).join("");
  return `<section class="emerald-related" aria-labelledby="${escapeAttr(headingId)}"><h2 id="${escapeAttr(headingId)}">相關</h2><div class="emerald-related-carousel" data-related-carousel><button class="emerald-related-control emerald-related-control-previous" type="button" data-related-previous aria-label="相關商品向左滑動">‹</button><div class="emerald-related-grid" data-related-track>${relatedCards}</div><button class="emerald-related-control emerald-related-control-next" type="button" data-related-next aria-label="相關商品向右滑動">›</button></div></section>
    <script>
    (() => {
      document.querySelectorAll('[data-related-carousel]').forEach((carousel) => {
        const track = carousel.querySelector('[data-related-track]');
        const move = (direction) => track.scrollBy({ left: direction * Math.max(track.clientWidth * .82, 280), behavior: 'smooth' });
        carousel.querySelector('[data-related-previous]').addEventListener('click', () => move(-1));
        carousel.querySelector('[data-related-next]').addEventListener('click', () => move(1));
      });
    })();
    </script>`;
}

const SOUVENIR_PRODUCT_DATES = new Map([
  ["/product-item/豆塔禮盒", "2024-10-18"],
  ["/product-item/森森肉鬆餅", "2022-06-20"],
  ["/product-item/法式蝴蝶酥-1657", "2022-06-20"],
  ["/product-item/鈕扣牛軋餅", "2022-06-20"],
  ["/product-item/太陽餅禮盒", "2018-11-19"],
  ["/product-item/手工蛋捲", "2018-11-19"],
  ["/product-item/鈕扣餅乾", "2018-11-19"],
  ["/product-item/鳳梨酥禮盒", "2018-11-19"],
  ["/product-item/土鳳梨酥禮盒", "2018-11-19"],
  ["/product-item/日式大福禮盒", "2018-11-19"],
]);

function souvenirRelatedCarousel(currentPath, headingId) {
  const relatedCards = SOUVENIR_PRODUCTS
    .filter(([, href]) => href !== currentPath)
    .map(([title, href, image]) => `<article class="emerald-related-card"><a href="${escapeAttr(href)}"><img src="/assets/images/${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy"><span>${escapeHtml(SOUVENIR_PRODUCT_DATES.get(href) || "")}</span><h3>${escapeHtml(title)}</h3><b aria-hidden="true">▪▪&nbsp; 更多</b></a></article>`)
    .join("");
  return `<section class="emerald-related souvenir-related" aria-labelledby="${escapeAttr(headingId)}"><h2 id="${escapeAttr(headingId)}">相關</h2><div class="emerald-related-carousel" data-related-carousel><button class="emerald-related-control emerald-related-control-previous" type="button" data-related-previous aria-label="相關商品向左滑動">‹</button><div class="emerald-related-grid" data-related-track>${relatedCards}</div><button class="emerald-related-control emerald-related-control-next" type="button" data-related-next aria-label="相關商品向右滑動">›</button></div></section>
    <script>
    (() => {
      document.querySelectorAll('[data-related-carousel]').forEach((carousel) => {
        const track = carousel.querySelector('[data-related-track]');
        const move = (direction) => track.scrollBy({ left: direction * Math.max(track.clientWidth * .82, 280), behavior: 'smooth' });
        carousel.querySelector('[data-related-previous]').addEventListener('click', () => move(-1));
        carousel.querySelector('[data-related-next]').addEventListener('click', () => move(1));
      });
    })();
    </script>`;
}

function souvenirProductContent(page) {
  const localPath = localPathFromUrl(page.url);
  const product = SOUVENIR_PRODUCT_DATA.get(localPath) || {};
  const markdown = String(markdownFromPage(page) || "").replace(/\r/g, "");
  const lines = markdown.split("\n").map((line) => line.trim());
  const cleanText = (value) => String(value || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const headings = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^#{2,6}\s+/.test(line))
    .map(({ line, index }) => ({ title: cleanText(line.replace(/^#{2,6}\s+/, "")), index }))
    .filter(({ title }) => title);
  const productTitle = headings[1]?.title || headings[0]?.title || product.title || titleFromPage(page);
  const productMarkdown = markdown.split(/\nShare\b/i)[0];
  const imageFiles = [...productMarkdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]
    .map(([, alt, source]) => ({ alt: cleanText(alt), source, file: localImageFile(source) }))
    .filter(({ alt, source, file }) => file
      && !/^icon-/.test(file)
      && !/parallax|background/i.test(alt)
      && !/headtitle-bg/i.test(`${source} ${file}`));
  const gallery = imageFiles.length
    ? imageFiles
    : [{ alt: productTitle, file: product.image || "photo-2.jpg" }];
  const separator = (line) => /^\*\s+\*\s+\*$/.test(line);
  const fieldLabels = ["口味", "規格", "蛋糕吋數", "保存方式", "其他"];
  const fieldLines = (label) => {
    const start = lines.findIndex((line) => line === label);
    if (start < 0) return [];
    const result = [];
    for (const line of lines.slice(start + 1)) {
      if (separator(line) || fieldLabels.includes(line)) break;
      if (line && !/^!\[[^\]]*\]\([^)]*\)$/.test(line)) result.push(line);
    }
    return result;
  };
  const descriptionStart = headings[1]?.index ?? headings[0]?.index ?? 0;
  const descriptionEnd = lines.slice(descriptionStart + 1).findIndex((line) => separator(line));
  const descriptionLines = lines.slice(descriptionStart + 1, descriptionEnd < 0 ? lines.length : descriptionStart + 1 + descriptionEnd)
    .filter((line) => line && !/^!\[[^\]]*\]\([^)]*\)$/.test(line) && !fieldLabels.includes(line) && !/^\[[^\]]+\]\([^)]*\)$/.test(line));
  const description = descriptionLines.map(cleanText).filter(Boolean).map(escapeHtml).join("<br>");
  const fields = fieldLabels
    .map((label) => ({ label, value: fieldLines(label).map(cleanText).filter(Boolean).map(escapeHtml).join("<br>") }))
    .filter(({ value }) => value);
  const badgeSource = markdown.match(/!\[[^\]]*\]\(([^)]*icon-(?:vlml|milk-vega|vega)[^)]*)\)/i)?.[1] || "";
  const badgeImage = localImageFile(badgeSource) || "icon-vlml.png";
  const likes = markdown.match(/\bShare\s*\n+\s*\[([0-9]+)/i)?.[1] || product.likes || "0";
  const galleryHtml = gallery.map(({ alt, file }) => `<img src="/assets/images/${escapeAttr(file)}" alt="${escapeAttr(alt || productTitle)}" loading="lazy">`).join("");
  const specsHtml = fields.map(({ label, value }) => `<div><dt>${escapeHtml(label)}</dt><dd>${value}</dd></div>`).join("");
  return `<section class="emerald-product-page bean-tart-product-page souvenir-product-page">
    <section class="emerald-product-feature bean-tart-feature" aria-labelledby="souvenir-product-title">
      <div class="bean-tart-gallery">${galleryHtml}</div>
      <div class="emerald-product-copy bean-tart-copy">
        <h2 id="souvenir-product-title">${escapeHtml(productTitle)}</h2>
        <div class="bean-tart-intro">${description ? `<p>${description}</p>` : ""}</div>
        ${specsHtml ? `<hr><dl class="bean-tart-specs">${specsHtml}</dl>` : ""}
        <div class="bean-tart-badge"><img src="/assets/images/${escapeAttr(badgeImage)}" alt="奶蛋素"></div>
      </div>
    </section>
    <div class="emerald-share"><div><span>Share</span><b aria-hidden="true">f</b><b aria-hidden="true">𝕏</b><b aria-hidden="true">in</b><b aria-hidden="true">p</b></div><div class="emerald-likes" aria-label="${escapeAttr(likes)} 個喜歡">♡ <span>${escapeHtml(likes)}</span></div></div>
    ${souvenirRelatedCarousel(localPath, "souvenir-related-title")}
  </section>`;
}

function emeraldLyskContent() {
  return `<section class="emerald-product-page">
    <section class="emerald-product-feature" aria-labelledby="emerald-product-title">
      <figure class="emerald-product-image"><img src="/assets/images/cake-2024-11.png" alt="綠寶石萊思克(季節限定)"></figure>
      <div class="emerald-product-copy">
        <h2 id="emerald-product-title">綠寶石萊思克(季節限定)</h2>
        <div class="emerald-product-description"><span>產品說明</span><p>香草蛋糕│法國萊思克乳霜、雙層當季新鮮綠葡萄</p></div>
        <p class="emerald-product-emphasis">※歐盟AOP認證，純粹乳香及果香交織成法式的質感享受</p>
        <dl class="emerald-product-specs">
          <div><dt>蛋糕吋數</dt><dd>6吋、8吋</dd></div>
          <div><dt>保存方式</dt><dd>需冷藏。離開冷藏，請於1小時內食用完畢</dd></div>
          <div><dt>其他</dt><dd>無添加防腐劑等食品添加物，天然食品效期較短，請於賞味期限內儘早食用完畢。</dd></div>
        </dl>
        <p class="emerald-product-note">※蛋糕造型或裝飾水果若有變更，請以門市販售為準</p>
        <div class="emerald-product-badge"><img src="/assets/images/icon-vlml.png" alt="奶蛋素"></div>
      </div>
    </section>
    <div class="emerald-share"><div><span>Share</span><b aria-hidden="true">f</b><b aria-hidden="true">𝕏</b><b aria-hidden="true">in</b><b aria-hidden="true">p</b></div><div class="emerald-likes" aria-label="10 個喜歡">♡ <span>10</span></div></div>
    ${cakeRelatedCarousel(EMERALD_LYSK_PATH, "emerald-related-title")}
  </section>`;
}

function birthdayCakeProductContent(page) {
  const localPath = localPathFromUrl(page.url);
  const product = CAKE_PRODUCT_DATA.get(localPath) || {};
  const markdown = String(markdownFromPage(page) || "").replace(/\r/g, "");
  const lines = markdown.split("\n").map((line) => line.trim());
  const labels = ["產品說明", "蛋糕吋數", "保存方式", "其他"];
  const fieldLines = (label) => {
    const start = lines.findIndex((line) => line === label);
    if (start < 0) return [];
    const result = [];
    for (const line of lines.slice(start + 1)) {
      if (line === "* * *" || labels.includes(line)) break;
      if (line && !/^!?\[[^\]]*\]\([^)]*\)$/.test(line)) result.push(line);
    }
    return result;
  };
  const cleanText = (value) => String(value || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const asHtml = (values) => values.map(cleanText).filter(Boolean).map(escapeHtml).join("<br>");
  const descriptionLines = fieldLines("產品說明");
  const emphasis = descriptionLines.find((line) => /AOP/i.test(line));
  const description = asHtml(descriptionLines.filter((line) => line !== emphasis));
  const size = asHtml(fieldLines("蛋糕吋數"));
  const storage = asHtml(fieldLines("保存方式"));
  const otherLines = fieldLines("其他");
  const noteIndex = otherLines.findIndex((line) => cleanText(line).startsWith("※蛋糕造型"));
  const note = noteIndex >= 0 ? cleanText(otherLines[noteIndex]) : "※蛋糕造型或裝飾水果若有變更，請以門市販售為準";
  const other = asHtml(noteIndex >= 0 ? otherLines.slice(0, noteIndex) : otherLines);
  const headings = lines
    .filter((line) => /^#{2,6}\s+/.test(line))
    .map((line) => cleanText(line.replace(/^#{2,6}\s+/, "")))
    .filter(Boolean);
  const productTitle = headings[1] || headings[0] || product.title || titleFromPage(page);
  const iconSource = markdown.match(/!\[[^\]]*\]\(([^)]*icon-(?:vlml|foraging)[^)]*)\)/i)?.[1] || "";
  const badgeImage = localImageFile(iconSource) || "icon-vlml.png";
  const likes = markdown.match(/\bShare\s*\n+\s*\[([0-9]+)/i)?.[1] || product.likes || "0";
  return `<section class="emerald-product-page cake-product-page">
    <section class="emerald-product-feature" aria-labelledby="cake-product-title">
      <figure class="emerald-product-image"><img src="/assets/images/${escapeAttr(product.image || "cake-2024-11.png")}" alt="${escapeAttr(productTitle)}"></figure>
      <div class="emerald-product-copy">
        <h2 id="cake-product-title">${escapeHtml(productTitle)}</h2>
        <div class="emerald-product-description"><span>產品說明</span><p>${description || "生日蛋糕"}</p></div>
        ${emphasis ? `<p class="emerald-product-emphasis">${escapeHtml(cleanText(emphasis))}</p>` : ""}
        <dl class="emerald-product-specs">
          <div><dt>蛋糕吋數</dt><dd>${size || "—"}</dd></div>
          <div><dt>保存方式</dt><dd>${storage || "需冷藏。離開冷藏，請於1小時內食用完畢"}</dd></div>
          <div><dt>其他</dt><dd>${other || "無添加防腐劑等食品添加物，天然食品效期較短，請於賞味期限內儘早食用完畢。"}</dd></div>
        </dl>
        <p class="emerald-product-note">${escapeHtml(note)}</p>
        <div class="emerald-product-badge"><img src="/assets/images/${escapeAttr(badgeImage)}" alt="蛋奶素"></div>
      </div>
    </section>
    <div class="emerald-share"><div><span>Share</span><b aria-hidden="true">f</b><b aria-hidden="true">𝕏</b><b aria-hidden="true">in</b><b aria-hidden="true">p</b></div><div class="emerald-likes" aria-label="${escapeAttr(likes)} 個喜歡">♡ <span>${escapeHtml(likes)}</span></div></div>
    ${cakeRelatedCarousel(localPath, "cake-related-title")}
  </section>`;
}

function beanTartProductContent() {
  return `<section class="emerald-product-page bean-tart-product-page">
    <section class="emerald-product-feature bean-tart-feature" aria-labelledby="bean-tart-title">
      <div class="bean-tart-gallery">
        <img src="/assets/images/photo-2.jpg" alt="豆塔禮盒豆塔" loading="lazy">
        <img src="/assets/images/photo-3-4.jpg" alt="豆塔禮盒包裝" loading="lazy">
        <img src="/assets/images/photo-4-3.jpg" alt="豆塔禮盒內容物" loading="lazy">
      </div>
      <div class="emerald-product-copy bean-tart-copy">
        <h2 id="bean-tart-title">豆塔禮盒</h2>
        <div class="bean-tart-intro"><p>不同手法的餅皮呈現帶出奶油與食材間的平衡。</p><p>夏威夷豆和果乾拌入蜂蜜綴在酥香豆塔餅皮上，也是我們的經典不敗款。</p></div>
        <hr>
        <dl class="bean-tart-specs">
          <div><dt>規格</dt><dd>6入、9入</dd></div>
          <div><dt>保存方式</dt><dd>可常溫保存，賞味期限詳見盒上標示，請避免放置潮濕高溫或曝曬之場所。</dd></div>
          <div><dt>其他</dt><dd>無添加防腐劑等食品添加物，天然食品效期較短，請於賞味期限內儘早食用完畢。</dd></div>
        </dl>
        <div class="bean-tart-badge"><img src="/assets/images/icon-vlml.png" alt="奶蛋素"></div>
      </div>
    </section>
    <div class="emerald-share"><div><span>Share</span><b aria-hidden="true">f</b><b aria-hidden="true">𝕏</b><b aria-hidden="true">in</b><b aria-hidden="true">p</b></div><div class="emerald-likes" aria-label="9 個喜歡">♡ <span>9</span></div></div>
    ${souvenirRelatedCarousel(BEAN_TART_PATH, "bean-tart-related-title")}
  </section>`;
}

function pageContent(page) {
  const localPath = localPathFromUrl(page.url);
  if (localPath === "/404-error") {
    return `<section class="not-found-page" aria-labelledby="not-found-title">
      <div class="not-found-card">
        <img class="not-found-art" src="/assets/images/photo-404-error.png" alt="404 Error">
        <h1 id="not-found-title">Page Not Found!</h1>
        <p>We are sorry, but the page you are looking for does not exist.</p>
        <a class="not-found-home" href="/">Back to Home</a>
      </div>
    </section>`;
  }
  if (localPath === "/關於森森") {
    return aboutContent();
  }
  if (localPath === PRODUCT_INTRO_PATH) {
    return storefrontCatalogContent("overview");
  }
  if (localPath === EMERALD_LYSK_PATH) {
    return emeraldLyskContent();
  }
  if (localPath === BEAN_TART_PATH) {
    return beanTartProductContent();
  }
  if (SOUVENIR_PRODUCT_PATHS.has(localPath)) {
    return souvenirProductContent(page);
  }
  if (CAKE_PRODUCT_PATHS.has(localPath)) {
    return birthdayCakeProductContent(page);
  }
  if (SEASONAL_CATALOGS.has(localPath)) {
    return seasonalCatalogContent(localPath);
  }
  if (localPath === BIRTHDAY_CAKE_PATH) {
    return storefrontCatalogContent("cakes");
  }
  if (localPath === "/產品介紹/伴手禮") {
    return storefrontCatalogContent("souvenir");
  }
  if (localPath === CATERING_PATH) {
    return cateringContent();
  }
  if (localPath === TEA_PARTY_PATH) {
    return teaPartyContent();
  }
  if (localPath === TASTE_APPLY_PATH) {
    return tasteApplyContent();
  }
  if (localPath === BOSTON_PIE_PATH) {
    return bostonPieContent();
  }
  if (localPath === BIG_BEAR_PATH) {
    return bigBearContent();
  }
  if (localPath === COUNTRY_CHEESE_PATH) {
    return countryCheeseContent();
  }
  if (localPath === ROUND_PIE_PATH) {
    return roundPieContent();
  }
  if (localPath === LONG_CAKE_PATH) {
    return longCakeContent();
  }
  if (localPath === PAIRING_PATH) {
    return pairingContent();
  }
  if (localPath === THANK_YOU_CARD_PATH) {
    return thankYouCardContent();
  }
  if (localPath === "/產品介紹/伴手禮") {
    return souvenirPageContent();
  }
  if (localPath === "/森森咖啡") {
    return coffeePageContent();
  }
  if (localPath === "/最新消息") {
    return latestNewsContent(page);
  }
  if (localPath === "/門市資訊") {
    return storeInfoContent();
  }
  if (localPath === "/常見問題") {
    return faqContent();
  }
  if (localPath === "/聯絡我們" || localPath === "/contact") {
    return contactPageContent();
  }
  if (localPath === "/customer/admin") return customerPageContent("login");
  if (localPath === "/customer/admin/backup") return customerPageContent("dashboard");
  if (localPath === "/customer") return customerPageContent("login");
  if (localPath === "/cart") return cartPageContent();
  if (localPath === "/checkout") return checkoutPageContent();
  if (localPath === "/orders") return ordersPageContent();

  const markdown = markdownFromPage(page);
  if (markdown.trim()) {
    const visibleMarkdown = removeRetiredContentCards(localPath === "/最新消息"
      ? removeLatestNewsPagination(markdown)
      : markdown);
    return `<section class="content">${decorateMonthDmContent(markdownToHtml(visibleMarkdown))}</section>`;
  }
  if (page.html && page.html.trim()) {
    const visibleHtml = removeRetiredContentCardsFromHtml(sanitizeWordPressHtml(page.html));
    return `<section class="content">${decorateMonthDmContent(visibleHtml)}</section>`;
  }
  if (!markdown.trim()) {
    return `<section class="content"><div class="empty">此頁在爬取結果中沒有正文，已依標題建立本地頁面。</div></section>`;
  }
  return "";
}

function latestNewsContent(page) {
  const filters = [
    ["全部", "all", true],
    ["季節限定", "season-only"],
    ["新品上市", "new-arrival"],
    ["最新消息", "latest-news"],
    ["森森飲品", "sensen-coffee"],
  ];
  const filterHtml = filters.map(([label, value, active]) => `<button class="latest-news-filter${active ? " is-active" : ""}" type="button" data-news-filter="${escapeAttr(value)}" aria-pressed="${active ? "true" : "false"}">${escapeHtml(label)}</button>`).join("");
  return `<section class="latest-news-page" data-latest-news-page aria-labelledby="latest-news-heading">
    <h2 class="latest-news-sr-only" id="latest-news-heading">最新消息</h2>
    <img class="latest-news-icon" src="/assets/images/icon-wheat.png" alt="" aria-hidden="true">
    <nav class="latest-news-filters" aria-label="最新消息分類">${filterHtml}</nav>
    <div class="latest-news-grid" data-news-list aria-live="polite"><p class="latest-news-empty">載入最新消息中…</p></div>
    <script src="/assets/latest-news.js"></script>
  </section>`;
}

function latestNewsArticleContent() {
  return `<section class="page-hero about-hero">
    <div class="hero-banner"><div class="image-slot" data-image-source="/assets/images/headtitle-bg2.jpg"><img src="/assets/images/headtitle-bg2.jpg" alt="頁首背景圖片"></div><div class="hero-banner-title"><p>/最新消息</p><h2 class="latest-news-article-section-title">最新消息</h2></div></div>
  </section>
  <section class="latest-news-article-page" data-latest-news-article-page aria-labelledby="latest-news-article-title">
    <img class="latest-news-article-icon" src="/assets/images/icon-wheat.png" alt="" aria-hidden="true">
    <a class="latest-news-article-back" href="/最新消息/">← 返回最新消息</a>
    <!-- NEWS_ARTICLE_SHELL_START --><div class="latest-news-article-shell">
      <p class="latest-news-article-status" data-article-status role="status">載入文章中…</p>
      <div class="latest-news-article-image" data-article-image></div>
      <div class="latest-news-article-copy">
        <p class="latest-news-card-date" data-article-date></p>
        <p class="latest-news-article-category" data-article-category></p>
        <h1 id="latest-news-article-title" data-article-title>最新消息</h1>
        <div class="latest-news-article-content" data-article-content></div>
      </div>
    </div><!-- NEWS_ARTICLE_SHELL_END -->
    <script src="/assets/latest-news-article.js"></script>
  </section>`;
}

function removeLatestNewsPagination(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const paginationIndex = lines.findIndex((line) =>
    /^\[\d+\]\([^)]+\)(?:\s+\[\d+\]\([^)]+\))+\s*$/.test(line.trim()),
  );
  if (paginationIndex < 0) return markdown;
  const nextContent = lines.slice(paginationIndex + 1).find((line) => line.trim());
  if (!nextContent || !/^\[下一頁\]/.test(nextContent.trim())) return markdown;
  return lines.slice(0, paginationIndex).join("\n");
}

function removeRetiredContentCards(markdown) {
  const blocks = String(markdown || "").split(/\n\s*\n/);
  const cardStarts = [];
  for (let index = 0; index < blocks.length - 1; index += 1) {
    if (/^\s*\d{4}-\d{2}-\d{2}\s*$/.test(blocks[index]) && /\]\([^)]+\)/.test(blocks[index + 1])) {
      cardStarts.push(index);
    }
  }
  if (!cardStarts.length) return markdown;
  cardStarts.push(blocks.length);
  const removed = new Set();
  for (let card = 0; card < cardStarts.length - 1; card += 1) {
    const start = cardStarts[card];
    const end = cardStarts[card + 1];
    const linksToRetiredContent = blocks.slice(start, end).some((block) =>
      [...block.matchAll(/\]\((https?:\/\/[^)]+|\/[^)]+)\)/g)].some((match) => {
        try {
          return RETIRED_CONTENT_PATHS.has(localPathFromUrl(new URL(match[1], SOURCE_ORIGIN).href));
        } catch {
          return false;
        }
      }),
    );
    if (linksToRetiredContent) {
      for (let index = start; index < end; index += 1) removed.add(index);
    }
  }
  return blocks.filter((block, index) => !removed.has(index)).join("\n\n");
}

function removeRetiredContentCardsFromHtml(html) {
  const cardPattern = /<p>\s*\d{4}-\d{2}-\d{2}\s*<\/p>[\s\S]*?<p>\s*<a\s+href="([^"]+)"[^>]*>更多<\/a>\s*<\/p>/gi;
  return String(html || "").replace(cardPattern, (card) => {
    const linksToRetiredContent = [...card.matchAll(/(?:href|data-image-source)="([^"]+)"/gi)].some((match) => {
      try {
        return RETIRED_CONTENT_PATHS.has(localPathFromUrl(new URL(match[1], SOURCE_ORIGIN).href));
      } catch {
        return false;
      }
    });
    return linksToRetiredContent ? "" : card;
  });
}

function decorateMonthDmContent(html) {
  return html
    .replace(/<h4>\s*彌月禮盒DM下載\s*⟶\s*<\/h4>/gi, '<p class="month-dm-download"><a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer">彌月禮盒DM下載 ⟶</a></p>')
    .replace(/<p>\s*完整商品資訊及價格，請參閱彌月商品目錄!\s*<\/p>/gi, '<p class="month-dm-note">完整商品資訊及價格，請參閱彌月商品目錄!</p>');
}

function sanitizeWordPressHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<a\b[^>]*>\s*<img\b([^>]*)>\s*<\/a>/gi, (match, attrs) => imageSlotHtml({ source: htmlAttribute(attrs, "src") }))
    .replace(/<img\b([^>]*)>/gi, (match, attrs) => imageSlotHtml({ source: htmlAttribute(attrs, "src") }))
    .replace(/<figure\b[^>]*>/gi, `<figure>`)
    .replace(/<h4>\s*彌月禮盒DM下載\s*⟶\s*<\/h4>/gi, '<p class="month-dm-download"><a href="https://drive.google.com/file/d/1TJ37PaOoP-FWIeEDpldMbflZhHqvNIuZ/view" target="_blank" rel="noreferrer">彌月禮盒DM下載 ⟶</a></p>')
    .replace(/<p>\s*完整商品資訊及價格，請參閱彌月商品目錄!\s*<\/p>/gi, '<p class="month-dm-note">完整商品資訊及價格，請參閱彌月商品目錄!</p>')
    .replace(/\s(?:src|srcset|sizes|data-(?!image-source\b)[\w-]+)=("[^"]*"|'[^']*')/gi, "")
    .replace(/href=(["'])(https?:\/\/www\.sensen\.com\.tw[^"']*)\1/gi, (match, quote, href) => `href=${quote}${escapeAttr(routeHref(href))}${quote}`)
    .replace(/href=(["'])https?:\/\/www\.sensen\.com\.tw\/?\1/gi, `href="/"`)
    .replace(/class=(["'])([^"']*)\1/gi, (match, quote, classes) => {
      const keep = classes.split(/\s+/).filter((name) => name === "image-slot" || name === "product-image" || name === "month-dm-download" || name === "month-dm-note");
      return keep.length ? `class=${quote}${keep.join(" ")}${quote}` : "";
    })
    .replace(/style=(["'])[^"']*\1/gi, "")
    .replace(/width=(["'])[^"']*\1/gi, "")
    .replace(/height=(["'])[^"']*\1/gi, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function htmlAttribute(attributes, name) {
  const match = String(attributes || "").match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match ? match[1] : "";
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyHomeFallback() {
  const indexFile = path.join(ROOT, "index.html");
  if (fs.existsSync(indexFile)) {
    const fallback = fs.readFileSync(indexFile, "utf8");
    const description = seoDescription("森森點心坊", "/", true);
    const seoHead = `<meta name="description" content="${escapeAttr(description)}">\n  <meta name="robots" content="noindex, follow">`;
    const optimizedFallback = fallback
      .replace(/(<meta name="viewport"[^>]*>)/i, `$1\n  ${seoHead}`)
      .replace(/<title>[\s\S]*?<\/title>/i, "<title>備用首頁 – 森森點心坊</title>");
    fs.writeFileSync(path.join(OUT_DIR, "standalone-home.html"), optimizedFallback);
  }
}

function hasImportedContentSources() {
  return [
    CRAWL_FILE,
    FALLBACK_FILE,
    ...WP_FILES,
    ...WORDPRESS_EXPORT_FILES,
  ].some((filePath) => fs.existsSync(filePath));
}

function pruneRetiredStaticSnapshot() {
  for (const localPath of RETIRED_CONTENT_PATHS) {
    const filePath = htmlFileForLocalPath(localPath);
    if (!filePath.startsWith(`${OUT_DIR}${path.sep}`) || localPath === "/") continue;
    if (fs.existsSync(filePath)) fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
  }

  const sitemapJsonFile = path.join(OUT_DIR, "site-map.json");
  if (fs.existsSync(sitemapJsonFile)) {
    const entries = readJson(sitemapJsonFile).filter((page) => {
      const localPath = String(page.path || localPathFromUrl(page.url || "")).replace(/\/+$/, "") || "/";
      return !RETIRED_CONTENT_PATHS.has(localPath);
    });
    fs.writeFileSync(sitemapJsonFile, `${JSON.stringify(entries, null, 2)}\n`);
  }

  const sitemapHtmlFile = path.join(OUT_DIR, "site-map.html");
  if (fs.existsSync(sitemapHtmlFile)) {
    let html = fs.readFileSync(sitemapHtmlFile, "utf8");
    html = html.replace(/\s*<a class="directory-card" href="([^"]+)">[\s\S]*?<\/a>/gi, (card, href) => {
      const localPath = localPathFromUrl(new URL(href, SOURCE_ORIGIN).href);
      return RETIRED_CONTENT_PATHS.has(localPath) ? "" : card;
    });
    html = html.replace(/\s*<section class="directory-group">\s*<h2>[^<]*<\/h2>\s*<div class="directory-grid">\s*<\/div>\s*<\/section>/gi, "");
    fs.writeFileSync(sitemapHtmlFile, html);
  }

  const redirectsFile = path.join(OUT_DIR, "_redirects");
  if (fs.existsSync(redirectsFile)) {
    const redirects = fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/).filter((line) => {
      const fields = line.trim().split(/\s+/);
      if (fields.length < 2) return true;
      return !fields.slice(0, 2).some((field) => {
        try {
          return RETIRED_CONTENT_PATHS.has(localPathFromUrl(new URL(field, SOURCE_ORIGIN).href));
        } catch {
          return false;
        }
      });
    });
    fs.writeFileSync(redirectsFile, `${redirects.join("\n").replace(/\n+$/, "")}\n`);
  }
}

function main() {
  // The crawler/API exports are intentionally not part of the deployable repo.
  // Keep the committed static snapshot when those optional source files are absent;
  // otherwise a clean Vercel build would erase the published pages before writing
  // only the small set of built-in module pages.
  if (!hasImportedContentSources() && fs.existsSync(path.join(OUT_DIR, "index.html"))) {
    pruneRetiredStaticSnapshot();
    process.stdout.write("No crawler/export sources found; preserving the committed static site snapshot.\n");
    return;
  }
  const crawlPages = fs.existsSync(CRAWL_FILE)
    ? normalizeCrawlPayload(readJson(CRAWL_FILE))
    : [];
  const fallbackPages = fs.existsSync(FALLBACK_FILE) ? readJson(FALLBACK_FILE) : [];
  const wpPages = readWordPressPages();
  const wpExportPages = readWordPressExport();
  const supplementalPages = readSupplementalMarkdownPages();
  const sourcePages = [
    ...STORE_MODULE_PAGES.map((page) => ({ ...page, source: "sensen-store-module" })),
    { url: "https://www.sensen.com.tw/聯絡我們/", title: "聯絡我們", html: "", source: "sensen-store-module" },
    ...wpPages,
    ...crawlPages.map((page) => ({ ...page, source: "firecrawl-crawl" })),
    ...supplementalPages,
    ...wpExportPages,
    ...fallbackPages.map((page) => ({ ...page, source: "legacy-crawl" })),
  ];

  const pageMap = new Map();
  sourcePages
    .map((page) => ({ ...page, url: page.url || page.metadata?.sourceURL || page.metadata?.url }))
    .filter((page) => page.url && (page.source === "sensen-store-module" || isVisiblePage(page.url)))
    .filter((page) => !isLatestNewsPaginationPath(localPathFromUrl(page.url)))
    .forEach((page) => {
      const key = localPathFromUrl(page.url).toLocaleLowerCase();
      pageMap.set(key, mergePage(pageMap.get(key), page));
    });

  for (const page of pageMap.values()) {
    const localPath = localPathFromUrl(page.url);
    const canonicalPath = localPath.replace(/-2$/, "");
    const canonicalPage = pageMap.get(canonicalPath.toLocaleLowerCase());
    if (canonicalPath !== localPath && canonicalPage && titleFromPage(canonicalPage) === titleFromPage(page)) {
      PRODUCT_ROUTE_ALIASES.set(localPath, canonicalPath);
    }
  }
  const pages = [...pageMap.values()]
    .filter((page) => !PRODUCT_ROUTE_ALIASES.has(localPathFromUrl(page.url)))
    .filter((page) => !RETIRED_CONTENT_PATHS.has(localPathFromUrl(page.url)))
    .sort((a, b) => localPathFromUrl(a.url).localeCompare(localPathFromUrl(b.url), "zh-Hant"));
  const titleCounts = new Map();
  for (const page of pages) {
    const localPath = localPathFromUrl(page.url);
    const title = pageTitleFor(page, localPath);
    titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
  }
  const duplicatedTitles = new Set([...titleCounts].filter(([, count]) => count > 1).map(([title]) => title));

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_DIR, "assets"), { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, ".assetsignore"), "# Dropbox conflict copies are local sync artifacts, not public site assets.\n*與 Chi Feng Kao 衝突的複本*\n");
  fs.copyFileSync(path.join(ROOT, "site.css"), path.join(OUT_DIR, "assets", "site.css"));
  fs.copyFileSync(path.join(__dirname, "cart-drawer.js"), path.join(OUT_DIR, "assets", "cart-drawer.js"));
  fs.copyFileSync(path.join(__dirname, "storefront-products.js"), path.join(OUT_DIR, "assets", "storefront-products.js"));
  fs.copyFileSync(path.join(__dirname, "product-detail-purchase.js"), path.join(OUT_DIR, "assets", "product-detail-purchase.js"));
  fs.copyFileSync(path.join(__dirname, "drink-menu-modal.js"), path.join(OUT_DIR, "assets", "drink-menu-modal.js"));
  fs.copyFileSync(path.join(__dirname, "cart-page.js"), path.join(OUT_DIR, "assets", "cart-page.js"));
  fs.copyFileSync(path.join(__dirname, "checkout-page.js"), path.join(OUT_DIR, "assets", "checkout-page.js"));
  fs.copyFileSync(path.join(__dirname, "checkout.css"), path.join(OUT_DIR, "assets", "checkout.css"));
  fs.copyFileSync(path.join(__dirname, "orders-page.js"), path.join(OUT_DIR, "assets", "orders-page.js"));
  fs.copyFileSync(path.join(__dirname, "home-news.js"), path.join(OUT_DIR, "assets", "home-news.js"));
  fs.copyFileSync(path.join(__dirname, "latest-news.js"), path.join(OUT_DIR, "assets", "latest-news.js"));
  fs.copyFileSync(path.join(__dirname, "latest-news-article.js"), path.join(OUT_DIR, "assets", "latest-news-article.js"));
  if (fs.existsSync(IMAGE_DATA_DIR)) {
    fs.cpSync(IMAGE_DATA_DIR, path.join(OUT_DIR, "assets", "images"), { recursive: true });
  }
  const adminFrontendDir = path.join(ROOT, "frontend", "admin");
  if (fs.existsSync(adminFrontendDir)) {
    fs.cpSync(adminFrontendDir, path.join(OUT_DIR, "admin"), { recursive: true });
    for (const file of fs.readdirSync(path.join(OUT_DIR, "admin"))) {
      if (!file.endsWith(".html")) continue;
      const adminFile = path.join(OUT_DIR, "admin", file);
      const html = fs.readFileSync(adminFile, "utf8");
      const adminTitle = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || "森森點心坊後台";
      const adminPath = file === "index.html" ? "/admin/" : `/admin/${file}`;
      const seoHead = `<meta name="description" content="${escapeAttr(adminTitle)}，僅供授權人員使用。">\n  <link rel="canonical" href="${SOURCE_ORIGIN}${adminPath}">\n  <meta name="robots" content="noindex, nofollow">`;
      fs.writeFileSync(adminFile, html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n  ${seoHead}`));
    }
  }

  const home = pages.find((page) => localPathFromUrl(page.url) === "/") || pages[0];
  for (const page of pages) {
    const localPath = localPathFromUrl(page.url);
    const isAboutPage = localPath === "/關於森森" || localPath === "/產品介紹/伴手禮" || localPath === "/森森咖啡";
    const filePath = htmlFileForLocalPath(localPath);
    ensureDir(filePath);
    const rawContent = localPath === "/" ? homeContent(pages) : pageContent(page);
    const content = normalizeHeadingStructure(rawContent, localPath);
    fs.writeFileSync(filePath, layout({
      title: uniquePageTitle(pageTitleFor(page, localPath), localPath, duplicatedTitles),
      pathLabel: decodeURI(localPath),
      content,
      isHome: localPath === "/",
      isAbout: isAboutPage,
      isEmeraldLysk: localPath === EMERALD_LYSK_PATH,
      isCakeProduct: CAKE_PRODUCT_PATHS.has(localPath),
      isBeanTartProduct: localPath === BEAN_TART_PATH,
      isSouvenirProduct: SOUVENIR_PRODUCT_PATHS.has(localPath),
      heroCategoryLabel: SOUVENIR_PRODUCT_PATHS.has(localPath) ? "伴手禮" : CAKE_PRODUCT_CATEGORY_LABELS.get(localPath),
      hasBrandedHero: BRANDED_HERO_PATHS.has(localPath) && localPath !== CATERING_PATH,
      showHero: localPath !== "/404-error" && localPath !== BIG_BEAR_PATH && localPath !== COUNTRY_CHEESE_PATH && localPath !== ROUND_PIE_PATH && localPath !== LONG_CAKE_PATH && localPath !== PAIRING_PATH && localPath !== THANK_YOU_CARD_PATH && localPath !== CATERING_PATH && localPath !== TEA_PARTY_PATH && localPath !== TASTE_APPLY_PATH && localPath !== "/聯絡我們" && localPath !== "/contact" && localPath !== "/checkout" && localPath !== "/customer" && localPath !== "/customer/admin" && localPath !== "/customer/admin/backup" && localPath !== "/cart" && localPath !== "/orders",
      heroSource: localPath === EMERALD_LYSK_PATH ? "/assets/images/headtitle-bg3.jpg" : localPath === BIRTHDAY_CAKE_PATH ? "/assets/images/headtitle-bg3.jpg" : localPath === BOSTON_PIE_PATH ? "/assets/images/headtitle-bg8.jpg" : localPath === "/門市資訊" ? STORE_INFO_HERO_SOURCE : localPath === "/森森咖啡" ? "/assets/images/cafe-coffee-restaurant-cup-food-drink-1008643-pxhere-2.jpg" : "/assets/images/headtitle-bg2.jpg",
    }));
  }

  if (!home || localPathFromUrl(home.url) !== "/") {
    fs.writeFileSync(path.join(OUT_DIR, "index.html"), layout({
      title: "森森點心坊",
      pathLabel: "/",
      content: homeContent(pages),
      isHome: true,
    }));
  }

  fs.writeFileSync(path.join(OUT_DIR, "site-map.html"), layout({
    title: "全站頁面",
    pathLabel: "/site-map.html",
    content: `<section class="directory"><h2>全站頁面</h2><p>以下為本地複製出的站內頁面索引。圖片皆以預留位呈現。</p>${createIndex(pages)}</section>`,
  }));

  const latestNewsArticleFile = path.join(OUT_DIR, "latest-news", "article", "index.html");
  ensureDir(latestNewsArticleFile);
  fs.writeFileSync(latestNewsArticleFile, layout({
    title: "最新消息",
    pathLabel: "/最新消息文章",
    content: latestNewsArticleContent(),
    showHero: false,
  }));

  const privacyFile = path.join(OUT_DIR, "隱私權條款", "index.html");
  ensureDir(privacyFile);
  const privacyHtml = layout({
    title: "隱私權政策",
    pathLabel: "/隱私權條款",
    content: `<section class="privacy-page">
      <p class="privacy-lead">非常歡迎您光臨「森森點心坊網站」（以下簡稱本網站），為了讓您能夠安心的使用本網站的各項服務與資訊，特此向您說明本網站的隱私權保護政策，以保障您的權益，請您詳閱下列內容：</p>
      <section class="privacy-section"><h2>一、隱私權保護政策的適用範圍</h2><p>隱私權保護政策內容，包括本網站如何處理在您使用網站服務時收集到的個人識別資料。隱私權保護政策不適用於本網站以外的相關連結網站，也不適用於非本網站所委託或參與管理的人員。</p></section>
      <section class="privacy-section"><h2>二、個人資料的蒐集、處理及利用方式</h2><ul><li>當您造訪本網站或使用本網站所提供之功能服務時，我們將視該服務功能性質，請您提供必要的個人資料，並在該特定目的範圍內處理及利用您的個人資料；非經您書面同意，本網站不會將個人資料用於其他用途。</li><li>本網站在您使用服務信箱、問卷調查等互動性功能時，會保留您所提供的姓名、電子郵件地址、聯絡方式及使用時間等。</li><li>於一般瀏覽時，伺服器會自行記錄相關行徑，包括您使用連線設備的 IP 位址、使用時間、使用的瀏覽器、瀏覽及點選資料記錄等，做為我們增進網站服務的參考依據，此記錄為內部應用，決不對外公佈。</li><li>為提供精確的服務，我們會將收集的問卷調查內容進行統計與分析，分析結果之統計數據或說明文字呈現，除供內部研究外，我們會視需要公佈統計數據及說明文字，但不涉及特定個人之資料。</li></ul></section>
      <section class="privacy-section"><h2>三、資料之保護</h2><ul><li>本網站主機均設有防火牆、防毒系統等相關的各項資訊安全設備及必要的安全防護措施，加以保護網站及您的個人資料採用嚴格的保護措施，只由經過授權的人員才能接觸您的個人資料，相關處理人員皆簽有保密合約，如有違反保密義務者，將會受到相關的法律處分。</li><li>如因業務需要有必要委託其他單位提供服務時，本網站亦會嚴格要求其遵守保密義務，並且採取必要檢查程序以確定其將確實遵守。</li></ul></section>
      <section class="privacy-section"><h2>四、網站對外的相關連結</h2><p>本網站的網頁提供其他網站的網路連結，您也可經由本網站所提供的連結，點選進入其他網站。但該連結網站不適用本網站的隱私權保護政策，您必須參考該連結網站中的隱私權保護政策。</p></section>
      <section class="privacy-section"><h2>五、與第三人共用個人資料之政策</h2><p>本網站絕不會提供、交換、出租或出售任何您的個人資料給其他個人、團體、私人企業或公務機關，但有法律依據或合約義務者，不在此限。</p><p>前項但書之情形包括不限於：</p><ul><li>經由您書面同意。</li><li>法律明文規定。</li><li>為免除您生命、身體、自由或財產上之危險。</li><li>與公務機關或學術研究機構合作，基於公共利益為統計或學術研究而有必要，且資料經過提供者處理或蒐集者依其揭露方式無從識別特定之當事人。</li><li>當您在網站的行為，違反服務條款或可能損害或妨礙網站與其他使用者權益或導致任何人遭受損害時，經網站管理單位研析揭露您的個人資料是為了辨識、聯絡或採取法律行動所必要者。</li><li>有利於您的權益。</li><li>本網站委託廠商協助蒐集、處理或利用您的個人資料時，將對委外廠商或個人善盡監督管理之責。</li></ul></section>
      <section class="privacy-section"><h2>六、Cookie 之使用</h2><p>為了提供您最佳的服務，本網站會在您的電腦中放置並取用我們的 Cookie，若您不願接受 Cookie 的寫入，您可在您使用的瀏覽器功能項中設定隱私權等級為高，即可拒絕 Cookie 的寫入，但可能會導致網站某些功能無法正常執行。</p></section>
      <section class="privacy-section"><h2>七、隱私權保護政策之修正</h2><p>本網站隱私權保護政策將因應需求隨時進行修正，修正後的條款將刊登於網站上。</p></section>
      <section class="privacy-contact"><h2>網站聯絡資訊</h2><p>有任何問題，歡迎利用本站中的 <a href="/contact/">連絡我們表單</a>。</p></section>
    </section>`,
    isAbout: true,
    hasBrandedHero: true,
    heroSource: "/assets/images/headtitle-bg2.jpg",
  });
  fs.writeFileSync(privacyFile, privacyHtml);
  fs.writeFileSync(path.join(OUT_DIR, "_redirects"), `${[...PRODUCT_ROUTE_ALIASES]
    .map(([aliasPath, canonicalPath]) => `${encodeURI(aliasPath)}/ ${encodeURI(canonicalPath)}/ 301`)
    .join("\n")}\n`);

  copyHomeFallback();
  fs.writeFileSync(path.join(OUT_DIR, "site-map.json"), JSON.stringify(pages.map((page) => ({
    title: titleFromPage(page),
    url: page.url,
    path: localPathFromUrl(page.url),
  })), null, 2));

  console.log(`Built ${pages.length} pages in ${path.relative(ROOT, OUT_DIR)}`);
}

main();
