# رفع الإضافة بأمر واحد — تظبيط مرة واحدة بس

بعد الخطوات دي، أي ريليز جاي = أمرين، من غير ما تفتح الـdev console خالص.

الخطوات 1–3 محتاجة حسابك في جوجل فلازم تعملها انت. الباقي بيشتغل لوحده.

---

## 1. مشروع + تفعيل الـAPI
افتح https://console.cloud.google.com/projectcreate
- الاسم: `couponwaly-release` (أي اسم).
- بعد ما يتعمل، افتح https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com
  واضغط **Enable**. اتأكد إن المشروع المختار فوق هو اللي لسه عاملـه.

## 2. شاشة الموافقة
افتح https://console.cloud.google.com/auth/overview
- User type: **External**.
- App name: `couponwaly release`، وايميل الدعم والمطوّر = ايميلك.
- احفظ، وبعدين من **Audience** اضغط **Publish app** (أو سيبها Testing وضيف ايميلك في Test users — الاتنين يمشّوا الحال).
- مش محتاج تضيف أي scopes في الشاشة دي.

## 3. OAuth client
افتح https://console.cloud.google.com/auth/clients → **Create client**
- Application type: **Desktop app**.
- الاسم: `couponwaly cli`.
- اضغط Create. هيطلعلك **Client ID** و**Client secret** — سيبهم مفتوحين قدامك للخطوة اللي بعدها.

## 3b. Test user أو Publish
الـclient الجديد بيشتغل مع **test users** بس طول ما التطبيق في وضع Testing.
- الأسهل: https://console.cloud.google.com/auth/audience → **Add users** → ايميلك.
- ⚠️ بس في وضع Testing **الـrefresh token بيموت كل 7 أيام**، يعني هتعيد خطوة 4 كل أسبوع.
- عشان يبقى دايم: نفس الصفحة → **Publish app**. بس الزرار بيفضل مقفول لحد ما تكمّل صفحة **Branding**
  (لوجو ودومين التطبيق)، فده شغل زيادة — سيبه لحد ما إعادة التفويض الأسبوعية تضايقك فعلًا.

## 4. التفويض (مرة واحدة)

```bash
cd ~/GitHub/couponwaly-extension && python3 tools/cws_auth.py ~/Downloads/client_secret_*.json
```

- بياخد الـclient من ملف الـJSON اللي نزّلته من الكونسول، فمفيش نسخ ولصق لأي secret.
- من غير الملف: `python3 tools/cws_auth.py` وهيسألك الـID والـsecret (الـsecret مش هيظهر وانت بتكتبه).
- هيفتح شاشة موافقة جوجل: سجّل دخول بالحساب اللي **مالك الإضافة** (`waly.wali30@gmail.com`).
- جوجل هتقول «Google hasn't verified this app» لأن ده تطبيقك انت — اضغط **Advanced** → **Go to couponwaly release (unsafe)**. ده طبيعي لتطبيق شخصي.
- لما يقولك «تمام، ارجع للترمينال»، خلاص.

التوكن بيتحفظ في `~/.config/couponwaly/cws.json` بصلاحية 600، **برّه الريبو** ومش داخل أي commit.

---

## الاستخدام بعد كده

```bash
cd ~/GitHub/couponwaly-extension && python3 tools/build.py 1.2.0 && python3 tools/publish.py 1.2.0
```

ده بيبني الزيب ويرفعه كـ**draft**. تراجعه في الـdev console، وبعدين:

```bash
cd ~/GitHub/couponwaly-extension && python3 tools/publish.py 1.2.0 --submit
```

وللاطمئنان على الحالة في أي وقت:

```bash
cd ~/GitHub/couponwaly-extension && python3 tools/publish.py --status
```

---

## اللي الـAPI **مش** بيعمله
الـAPI بيرفع **الحزمة** بس. الوصف الطويل والصور والتصنيف بيتحطوا بالإيد في الـdev console.
يعني المرة دي لسه محتاج تلصق الوصف وترفع الصور الخمسة من `store/PASTE-1.2.0.md` — بس ده لمرة واحدة،
وبعدها كل ريليز فيه كود بس هيعدي بالأمرين اللي فوق.

## لو حاجة وقعت
- `no refresh token came back` → امسح التطبيق من https://myaccount.google.com/permissions وشغّل `cws_auth.py` تاني.
- `HTTP 401` → التوكن اتسحب؛ شغّل `cws_auth.py` تاني.
- `HTTP 403 ... has not been used in project` → الـAPI مش متفعّل، ارجع لخطوة 1.
- رقم الإصدار لازم يكون **أكبر** من المنشور، وإلا الرفع هيترفض.
