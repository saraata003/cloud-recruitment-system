# DRINKAT Pickup

تطبيق ويب للموبايل للطلب المسبق من **DRINKAT Cloud Kitchen**: الزبون يطلب أونلاين وينتظر حتى يجهز الطلب، ثم يأتي ويستلمه بنفسه. لا يوجد توصيل.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS 4 · SQLite (مدمج في Node 22، بدون أي خدمة خارجية)

## التشغيل

```bash
npm install
npm run dev          # http://localhost:3000
```

الإنتاج: `npm run build && npm start`. يحتاج Node 22.13 أو أحدث.

قاعدة البيانات (`data/drinkat.db`) تُنشأ تلقائياً عند أول تشغيل ومعها منيو تجريبي. الصور المرفوعة تُحفظ في `data/uploads`.

> بما أن البيانات تُحفظ في ملف، يجب أن يُنشر التطبيق على سيرفر بقرص دائم (VPS، Railway، Render مع disk، …) وليس على serverless مثل Vercel.

## الصفحات

| الرابط | لمن | الوصف |
|---|---|---|
| `/` | الزبون | الرئيسية |
| `/menu` | الزبون | المنيو، بحث وأقسام |
| `/product/[id]` | الزبون | تفاصيل المنتج، الإضافات، الكمية، الملاحظات |
| `/cart` | الزبون | السلة |
| `/checkout` | الزبون | الاسم ورقم الهاتف وطريقة الدفع |
| `/order/[id]` | الزبون | تتبع الطلب (يتحدث تلقائياً كل 4 ثواني) |
| `/orders` | الزبون | طلباتي (محفوظة على الجهاز، بدون تسجيل دخول) |
| `/kitchen` | الموظف | شاشة المطبخ: NEW / PREPARING / READY مع تنبيه صوتي للطلبات الجديدة |
| `/admin` | المدير | المنتجات والأقسام والإضافات وحالة المطبخ |

صفحتا `/kitchen` و `/admin` محميتان برمز PIN واحد (`STAFF_PIN`، الافتراضي `1234`). **غيّره قبل النشر.**

## مسار الطلب

```
pending → (Accept + 5/10/15/20/30 دقيقة) → accepted → preparing → ready → picked_up
pending → rejected
```

حالة المطبخ: `OPEN`، و`BUSY` (يضيف 10 دقائق على الوقت المتوقع)، و`VERY BUSY` (يضيف 20 دقيقة)، و`PAUSED` (يمنع الطلبات الجديدة).

أسعار الطلب تُحسب دائماً على السيرفر من قاعدة البيانات، ولا يُعتمد على أي سعر يرسله المتصفح.

## نقاط الربط لاحقاً

| الملف | ماذا تفعل |
|---|---|
| `src/lib/services/foodics.ts` | **FoodicsService**: `sendOrder` و`getOrderStatus` و`syncProducts` و`syncPrices`. تعمل حالياً كـ Mock، وتستخدم الـ API الحقيقي عند تعبئة `FOODICS_API_TOKEN` و`FOODICS_BRANCH_ID`. يُرسل الطلب إلى Foodics عند قبوله من المطبخ. |
| `src/lib/services/payments.ts` | **PaymentService**: طبقة الدفع (بطاقة، CliQ، كاش). حالياً Mock. أضف Provider حقيقي واختره عبر `PAYMENT_PROVIDER`. |
| `src/lib/services/notifications.ts` | **NotificationService**: رسائل الحالة، مثل "طلبك من DRINKAT جاهز للاستلام. رقم الطلب 184". حالياً تُكتب في الـ log فقط. أضف قناة SMS أو WhatsApp في `channels()`. |
| `src/lib/repo.ts` | كل استعلامات قاعدة البيانات في هذا الملف، فإذا انتقلنا إلى Supabase أو Postgres نغيّره هو فقط. |

انسخ `.env.example` إلى `.env` لضبط الإعدادات.

## البيانات

الجداول: `products` و`categories` و`addons` و`orders` و`order_items` و`order_status_history` و`settings`.

المنيو التجريبي موجود في `src/lib/seed.ts`، ويمكن تعديل كل شيء من `/admin` بدون تعديل الكود. لإعادة البيانات التجريبية احذف `data/drinkat.db`.

كل طلب له رقم داخلي عشوائي (UUID) يُستخدم في رابط التتبع، ورقم استلام بسيط للزبون يبدأ من 101.
