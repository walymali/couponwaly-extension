# Chrome Web Store / Edge Add-ons listing: كوبون والي

## الملف اللي هيترفع
`dist/couponwaly-extension-1.0.0.zip` (اتعمل بـ `python3 tools/build.py 1.0.0`).

## الاسم
- AR: كوبون والي – أكواد خصم شغالة للسعودية والخليج
- EN: Couponwaly – Working Promo Codes for Saudi & Gulf Stores

## الوصف المختصر (أقصى حاجة 132 حرف)
- AR: أكواد خصم شغالة لنون ونمشي وماكس فاشون وأكتر من 70 متجر خليجي، بتظهر لك وانت بتتسوق وتنسخها بضغطة.
- EN: Working promo codes for Noon, Namshi, Max Fashion and 70+ Gulf stores, shown while you shop. Copy in one click.

## الوصف الكامل (AR)
إضافة كوبون والي بتوريك أكواد الخصم الشغالة للمتجر اللي انت فاتحه، من غير ما تدور في جوجل.

• بتشتغل على أكتر من 70 متجر في السعودية والإمارات والكويت ومصر، زي نون ونمشي وماكس فاشون ونايس ون وستايلي وممزورلد وليفل شوز.
• أول ما تفتح موقع متجر عندنا ليه كود، بتظهر لك بطاقة صغيرة فيها عدد الأكواد، وتقدر تقفلها بضغطة.
• كل كود مكتوب معاه شرطه الحقيقي: النسبة والحد الأقصى والدول.
• تقدر تختار الدولة واللغة (عربي أو English) من أيقونة الإضافة.
• خصوصيتك محفوظة: الإضافة مش بتبعت تصفحك لأي حد، والمقارنة بتحصل جوه متصفحك.

الإضافة مجانية. وممكن نحصل على عمولة من المتجر لو اشتريت بعد ما تدوس «انسخ وافتح المتجر»، من غير أي تكلفة عليك.

## Full description (EN)
The Couponwaly extension shows the working promo codes for the store you are on, so you don't have to search for them.

• Works on 70+ stores in Saudi Arabia, the UAE, Kuwait and Egypt, including Noon, Namshi, Max Fashion, NiceOne, Styli, Mumzworld and Level Shoes.
• When you open a store we have codes for, a small card shows how many codes there are. You can close it in one click.
• Every code comes with its real terms: the rate, the cap and the countries.
• Pick your country and language (Arabic or English) from the toolbar icon.
• Private by design: your browsing is never sent anywhere, and the matching happens inside your browser.

The extension is free. We may earn a commission if you buy after clicking "Copy & open store", at no cost to you.

## Category / language
- التصنيف: Shopping
- اللغة الأساسية: Arabic، وفيه English كمان

## Privacy (Data usage form)
- **Privacy policy URL:** https://couponwaly.com/extension-privacy/
- **Single purpose:** show working promo codes for the store the user is visiting.
- **Permissions:**
  - `storage`: بتحفظ قايمة الأكواد والإعدادات.
  - `alarms`: بتحدّث القايمة كل 6 ساعات.
  - **Host permissions:** على مواقع المتاجر اللي في القايمة بس (85 دومين) + couponwaly.com. مش على كل المواقع.
- **Data collected:** None.
- **Remote code:** No.
- **Affiliate disclosure:**
  - بيتفتح رابط الشريك بس لما المستخدم يدوس «Copy & open store».
  - مفيش أي تبديل تلقائي للينكات، ومفيش كوكيز بتتحط في الخلفية.
  - ده متوافق مع سياسة Chrome Web Store (Affiliate Ads policy، تحديث 2025).

## صور المتجر المطلوبة
- **Screenshots (1280×800):** 3–5 صور. أولها البطاقة على موقع المتجر (`test/shot-store.png`)، وبعدها نافذة الإضافة.
- **Small promo tile (440×280):** اختياري.
- **Icon:** 128×128، موجود في `src/icons/icon-128.png`.

## النشر
1. **Chrome Web Store:** https://chrome.google.com/webstore/devconsole. 🧑 تسجيل حساب مطوّر برسوم 5 دولار مرة واحدة، وبعدها ارفع الـ zip. المراجعة غالبًا بين يوم و3 أيام.
2. **Microsoft Edge Add-ons:** https://partner.microsoft.com/dashboard/microsoftedge. 🧑 مجاني، ونفس الـ zip.
3. **بعد الموافقة:**
   - زرار «أضف الإضافة لكروم» في الفوتر وفي صفحة الجمعة البيضاء.
   - صفحة `/extension/` على الموقع.

## تحديث الإضافة لما يتضاف متجر جديد
- الأكواد بتتحدّث لوحدها كل 6 ساعات من الموقع، من غير إصدار جديد.
- لكن **دومين متجر جديد** محتاج إصدار جديد: `python3 tools/build.py 1.0.1`، وبعدها ارفع الـ zip.
