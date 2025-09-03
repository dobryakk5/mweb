"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUser = addUser;
exports.updateUserById = updateUserById;
exports.deleteUserById = deleteUserById;
exports.addAd = addAd;
exports.updateAdById = updateAdById;
exports.updateAdByUrl = updateAdByUrl;
exports.getAdByUrl = getAdByUrl;
exports.getAdById = getAdById;
exports.getAdsByFlatId = getAdsByFlatId;
exports.deleteAdById = deleteAdById;
exports.deleteAdByUrl = deleteAdByUrl;
const db_1 = __importDefault(require("./db"));
const schema_1 = require("./schema");
const orm_1 = require("./orm");
// ========== USERS MUTATIONS (существующие) ==========
async function addUser(values) {
    return await db_1.default.insert(schema_1.users).values({
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
    }).returning({ id: schema_1.users.id });
}
async function updateUserById(id, values) {
    return await db_1.default
        .update(schema_1.users)
        .set({
        ...values,
        updatedAt: new Date(),
    })
        .where((0, orm_1.eq)(schema_1.users.id, id))
        .returning({
        id: schema_1.users.id,
        username: schema_1.users.username,
        firstName: schema_1.users.firstName,
        lastName: schema_1.users.lastName,
    });
}
async function deleteUserById(id) {
    return await db_1.default.delete(schema_1.users).where((0, orm_1.eq)(schema_1.users.id, id));
}
// Создать новое объявление
async function addAd(values) {
    return await db_1.default.insert(schema_1.ads).values({
        flatId: values.flatId,
        url: values.url,
        address: values.address,
        price: values.price,
        rooms: values.rooms,
        views: 0,
    }).returning({
        id: schema_1.ads.id,
        url: schema_1.ads.url,
        flatId: schema_1.ads.flatId
    });
}
// Обновить объявление по ID (НЕ трогаем id, url, flatId)
async function updateAdById(id, values) {
    const updateData = {
        updatedAt: new Date(),
    };
    // Обновляем только переданные поля
    if (values.address !== undefined)
        updateData.address = values.address;
    if (values.price !== undefined)
        updateData.price = values.price;
    if (values.rooms !== undefined)
        updateData.rooms = values.rooms;
    if (values.totalArea !== undefined)
        updateData.totalArea = values.totalArea;
    if (values.livingArea !== undefined)
        updateData.livingArea = values.livingArea;
    if (values.kitchenArea !== undefined)
        updateData.kitchenArea = values.kitchenArea;
    if (values.floor !== undefined)
        updateData.floor = values.floor;
    if (values.totalFloors !== undefined)
        updateData.totalFloors = values.totalFloors;
    if (values.bathroom !== undefined)
        updateData.bathroom = values.bathroom;
    if (values.balcony !== undefined)
        updateData.balcony = values.balcony;
    if (values.renovation !== undefined)
        updateData.renovation = values.renovation;
    if (values.furniture !== undefined)
        updateData.furniture = values.furniture;
    if (values.constructionYear !== undefined)
        updateData.constructionYear = values.constructionYear;
    if (values.houseType !== undefined)
        updateData.houseType = values.houseType;
    if (values.ceilingHeight !== undefined)
        updateData.ceilingHeight = values.ceilingHeight;
    if (values.metroStation !== undefined)
        updateData.metroStation = values.metroStation;
    if (values.metroTime !== undefined)
        updateData.metroTime = values.metroTime;
    if (values.tags !== undefined)
        updateData.tags = values.tags;
    if (values.description !== undefined)
        updateData.description = values.description;
    if (values.photoUrls !== undefined)
        updateData.photoUrls = values.photoUrls;
    if (values.source !== undefined)
        updateData.source = values.source;
    if (values.status !== undefined)
        updateData.status = values.status;
    if (values.viewsToday !== undefined)
        updateData.viewsToday = values.viewsToday;
    if (values.totalViews !== undefined)
        updateData.totalViews = values.totalViews;
    return await db_1.default
        .update(schema_1.ads)
        .set(updateData)
        .where((0, orm_1.eq)(schema_1.ads.id, id))
        .returning({
        id: schema_1.ads.id,
        url: schema_1.ads.url,
        flatId: schema_1.ads.flatId,
        address: schema_1.ads.address,
        price: schema_1.ads.price,
        updatedAt: schema_1.ads.updatedAt,
    });
}
// Обновить объявление по URL (находим по URL, обновляем по ID)
async function updateAdByUrl(url, values) {
    // Сначала находим запись по URL
    const existingAd = await db_1.default
        .select({ id: schema_1.ads.id })
        .from(schema_1.ads)
        .where((0, orm_1.eq)(schema_1.ads.url, url))
        .limit(1);
    if (existingAd.length === 0) {
        throw new Error(`No ad found with URL: ${url}`);
    }
    const adToUpdate = existingAd[0];
    if (!adToUpdate) {
        throw new Error(`Ad data is undefined for URL: ${url}`);
    }
    // Обновляем найденную запись
    return await updateAdById(adToUpdate.id, values);
}
// Получить объявление по URL
async function getAdByUrl(url) {
    return await db_1.default
        .select()
        .from(schema_1.ads)
        .where((0, orm_1.eq)(schema_1.ads.url, url))
        .limit(1);
}
// Получить объявление по ID
async function getAdById(id) {
    return await db_1.default
        .select()
        .from(schema_1.ads)
        .where((0, orm_1.eq)(schema_1.ads.id, id))
        .limit(1);
}
// Получить все объявления для квартиры
async function getAdsByFlatId(flatId) {
    return await db_1.default
        .select()
        .from(schema_1.ads)
        .where((0, orm_1.eq)(schema_1.ads.flatId, flatId))
        .orderBy(schema_1.ads.createdAt);
}
// Удалить объявление по ID
async function deleteAdById(id) {
    return await db_1.default.delete(schema_1.ads).where((0, orm_1.eq)(schema_1.ads.id, id));
}
// Удалить объявление по URL
async function deleteAdByUrl(url) {
    return await db_1.default.delete(schema_1.ads).where((0, orm_1.eq)(schema_1.ads.url, url));
}
//# sourceMappingURL=mutations.js.map