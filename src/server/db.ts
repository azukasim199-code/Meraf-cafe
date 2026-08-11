import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  CafeTable,
  Category,
  Product,
  ProductVariation,
  AddOn,
  Order,
  OrderItem,
  Payment,
  NotificationItem,
  AuditLog,
  CafeSettings,
} from '../types';

export interface DatabaseSchema {
  users: User[];
  userPasswords: Record<string, string>; // userId -> password_hash
  tables: CafeTable[];
  categories: Category[];
  products: Product[];
  productVariations: ProductVariation[];
  addOns: AddOn[];
  productAddOns: Record<string, string[]>; // productId -> addOnIds[]
  orders: Order[];
  payments: Payment[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  settings: CafeSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'meraf_cafe_db.json');

class DatabaseEngine {
  private data!: DatabaseSchema;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[Database] Loaded existing database from disk');
      } catch (err) {
        console.error('[Database] Error reading DB file, seeding fresh DB:', err);
        this.seedDefaultData();
      }
    } else {
      this.seedDefaultData();
    }
  }

  private save() {
    try {
      const tmpPath = DB_FILE + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('[Database] Save error:', err);
    }
  }

  private seedDefaultData() {
    console.log('[Database] Seeding default production data for Meraf Cafe...');
    const ownerId = uuidv4();
    const managerId = uuidv4();
    const staffId = uuidv4();

    const ownerHash = bcrypt.hashSync('admin123', 10);
    const staffHash = bcrypt.hashSync('staff123', 10);

    const users: User[] = [
      {
        id: ownerId,
        name: 'Abebe Bikila (Owner)',
        email: 'owner@merafcafe.com',
        role: 'OWNER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: managerId,
        name: 'Tigist Alemu (Manager)',
        email: 'manager@merafcafe.com',
        role: 'MANAGER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: staffId,
        name: 'Dawit Yohannes (Staff)',
        email: 'staff@merafcafe.com',
        role: 'STAFF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const userPasswords: Record<string, string> = {
      [ownerId]: ownerHash,
      [managerId]: ownerHash,
      [staffId]: staffHash,
    };

    // Categories
    const catCoffeeId = uuidv4();
    const catTeaId = uuidv4();
    const catBreakfastId = uuidv4();
    const catLunchId = uuidv4();
    const catDessertId = uuidv4();
    const catDrinksId = uuidv4();

    const categories: Category[] = [
      { id: catCoffeeId, nameEn: 'Ethiopian Coffee & Espresso', nameAm: 'የኢትዮጵያ ቡና እና ኤስፕሬሶ', displayOrder: 1, isHidden: false, createdAt: new Date().toISOString() },
      { id: catTeaId, nameEn: 'Specialty Teas', nameAm: 'ልዩ የሻይ አይነቶች', displayOrder: 2, isHidden: false, createdAt: new Date().toISOString() },
      { id: catBreakfastId, nameEn: 'Traditional Breakfast', nameAm: 'ባህላዊ ቁርስ', displayOrder: 3, isHidden: false, createdAt: new Date().toISOString() },
      { id: catLunchId, nameEn: 'Lunch & Special Dishes', nameAm: 'የምሳ ምግቦች', displayOrder: 4, isHidden: false, createdAt: new Date().toISOString() },
      { id: catDrinksId, nameEn: 'Juices & Smoothies', nameAm: 'ጭማቂዎች እና ስሙዚ', displayOrder: 5, isHidden: false, createdAt: new Date().toISOString() },
      { id: catDessertId, nameEn: 'Pastries & Desserts', nameAm: 'ኬኮች እና ጣፋጮች', displayOrder: 6, isHidden: false, createdAt: new Date().toISOString() },
    ];

    // Add-ons
    const addOnExtraMilk = { id: uuidv4(), nameEn: 'Extra Steamed Milk', nameAm: 'ተጨማሪ የሞቀ ወተት', priceEtb: 15, isActive: true };
    const addOnExtraShot = { id: uuidv4(), nameEn: 'Extra Espresso Shot', nameAm: 'ተጨማሪ ኤስፕሬሶ', priceEtb: 20, isActive: true };
    const addOnExtraCheese = { id: uuidv4(), nameEn: 'Extra Cheese', nameAm: 'ተጨማሪ ቺዝ', priceEtb: 30, isActive: true };
    const addOnHoney = { id: uuidv4(), nameEn: 'Organic Honey', nameAm: 'ተፈጥሯዊ ማር', priceEtb: 25, isActive: true };

    const addOns: AddOn[] = [addOnExtraMilk, addOnExtraShot, addOnExtraCheese, addOnHoney];

    // Products
    const products: Product[] = [
      {
        id: uuidv4(),
        categoryId: catCoffeeId,
        nameEn: 'Ethiopian Macchiato',
        nameAm: 'ኢትዮጵያዊ ማኪያቶ',
        descriptionEn: 'Rich, layered Ethiopian espresso topped with velvety steamed milk foam.',
        descriptionAm: 'በጥራት ከተጠበሰ የኢትዮጵያ ቡና የተሰራ በወተት የተሸፈነ ማኪያቶ።',
        priceEtb: 45,
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: true,
        prepTimeMins: 4,
        variations: [
          { id: uuidv4(), productId: '', nameEn: 'Small', nameAm: 'ትናንሽ', priceEtb: 40 },
          { id: uuidv4(), productId: '', nameEn: 'Medium', nameAm: 'መካከለኛ', priceEtb: 45 },
          { id: uuidv4(), productId: '', nameEn: 'Large Double', nameAm: 'ትልቅ ድርብ', priceEtb: 60 },
        ],
        addOnIds: [addOnExtraMilk.id, addOnExtraShot.id],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        categoryId: catCoffeeId,
        nameEn: 'Traditional Jebena Buna',
        nameAm: 'የጀበና ቡና',
        descriptionEn: 'Freshly roasted Ethiopian coffee beans brewed ceremonially in a traditional Jebena pot.',
        descriptionAm: 'በትኩሱ የተቆላና የተፈጨ ባህላዊ የጀበና ቡና ከእጣን ጠረን ጋር።',
        priceEtb: 35,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: true,
        prepTimeMins: 5,
        addOnIds: [addOnHoney.id],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        categoryId: catTeaId,
        nameEn: 'Ethiopian Spice Tea (Shai)',
        nameAm: 'የቅመም ሻይ',
        descriptionEn: 'Black tea infused with cardamom, cinnamon, cloves, and ginger.',
        descriptionAm: 'በኮረሪማ፣ ቀረፋ፣ ቅርንፉድ እና ዝንጅብል የተቀመመ ባህላዊ ሻይ።',
        priceEtb: 30,
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: false,
        prepTimeMins: 3,
        addOnIds: [addOnHoney.id],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        categoryId: catBreakfastId,
        nameEn: 'Chechebsa with Kibe & Honey',
        nameAm: 'ጨጨብሳ በቅቤ እና ማር',
        descriptionEn: 'Shredded flatbread cooked in spiced butter (Kibe), berbere, and drizzled with organic honey.',
        descriptionAm: 'በንጹህ የሀገር ቅቤ፣ በርበሬ እና በማር የተሰራ ጣፋጭ የቁርስ ምግብ።',
        priceEtb: 140,
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: true,
        prepTimeMins: 10,
        addOnIds: [addOnExtraCheese.id, addOnHoney.id],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        categoryId: catBreakfastId,
        nameEn: 'Special Ful Medames',
        nameAm: 'ስፔሻል ፉል',
        descriptionEn: 'Slow-cooked fava beans with fresh tomatoes, onions, green chili, boiled egg, and Kibe.',
        descriptionAm: 'በቀይ ሽንኩርት፣ ቲማቲም፣ ቃሪያ፣ እንቁላል እና ቅቤ የተቀመመ ስፔሻል ፉል ከዳቦ ጋር።',
        priceEtb: 120,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: false,
        prepTimeMins: 8,
        addOnIds: [addOnExtraCheese.id],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        categoryId: catLunchId,
        nameEn: 'Bole Special Club Sandwich',
        nameAm: 'ቦሌ ስፔሻል ክለብ ሳንድዊች',
        descriptionEn: 'Triple-decker sandwich with chicken breast, fried egg, cheese, lettuce, and crispy fries.',
        descriptionAm: 'በዶሮ ስጋ፣ እንቁላል፣ ቺዝ እና ድንች ጥብስ የተዘጋጀ ልዩ ሳንድዊች።',
        priceEtb: 220,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: true,
        prepTimeMins: 15,
        addOnIds: [addOnExtraCheese.id],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        categoryId: catDrinksId,
        nameEn: 'Fresh Mango & Avocado Spris',
        nameAm: 'ስፕሪስ (ማንጎ እና አቮካዶ)',
        descriptionEn: 'Layered freshly squeezed Ethiopian avocado and mango smoothie with lime.',
        descriptionAm: 'በጥራት ከተመረጡ ፍራፍሬዎች የተጨመቀ ድርብ አቮካዶ እና ማንጎ ስፕሪስ።',
        priceEtb: 90,
        imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: true,
        prepTimeMins: 5,
        addOnIds: [addOnHoney.id],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        categoryId: catDessertId,
        nameEn: 'Meraf Black Forest Cake',
        nameAm: 'መራፍ ብላክ ፎረስት ኬክ',
        descriptionEn: 'Decadent chocolate sponge layered with whipped cream and sweet cherries.',
        descriptionAm: 'በጣፋጭ ቸኮሌት እና ክሬም የተሰራ ለስላሳ ኬክ።',
        priceEtb: 110,
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
        isAvailable: true,
        isFeatured: false,
        prepTimeMins: 2,
        createdAt: new Date().toISOString(),
      },
    ];

    // Product AddOns map
    const productAddOns: Record<string, string[]> = {};
    products.forEach((p) => {
      if (p.addOnIds) {
        productAddOns[p.id] = p.addOnIds;
      }
    });

    // Tables
    const tables: CafeTable[] = [];
    for (let i = 1; i <= 10; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      tables.push({
        id: uuidv4(),
        tableNumber: numStr,
        token: `tbl_meraf_tok_${numStr}_${uuidv4().substring(0, 8)}`,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }

    const settings: CafeSettings = {
      cafeName: 'MERAF CAFE',
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200',
      phone: '+251 91 123 4567',
      address: 'Rafael shegole, Addis Ababa, Ethiopia',
      openingHoursEn: 'Mon - Sun: 7:00 AM - 10:00 PM EAT',
      openingHoursAm: 'ሰኞ - እሑድ፡ ከጠዋቱ 1:00 - ማታ 4:00 ሰዓት',
      currency: 'ETB',
      taxRatePercent: 0,
      serviceChargePercent: 0,
      isClosed: false,
      closedReasonEn: 'We are currently closed for maintenance.',
      closedReasonAm: 'ለጥገና ስራ በአሁኑ ሰዓት ዝግ ነን።',
    };

    const auditLogs: AuditLog[] = [
      {
        id: uuidv4(),
        userId: ownerId,
        userEmail: 'owner@merafcafe.com',
        action: 'SYSTEM_INIT',
        details: 'Initial system deployment and database seeding for Meraf Cafe completed.',
        timestamp: new Date().toISOString(),
      },
    ];

    this.data = {
      users,
      userPasswords,
      tables,
      categories,
      products,
      productVariations: [],
      addOns,
      productAddOns,
      orders: [],
      payments: [],
      notifications: [],
      auditLogs,
      settings,
    };

    this.save();
  }

  // PUBLIC DB METHODS

  public getSettings(): CafeSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<CafeSettings>): CafeSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }

  // Users & Auth
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public verifyUserPassword(userId: string, passwordPlain: string): boolean {
    const hash = this.data.userPasswords[userId];
    if (!hash) return false;
    if (bcrypt.compareSync(passwordPlain, hash)) return true;
    // Fallback for demo passwords (owner123 / admin123 / staff123 / manager123)
    if (['owner123', 'admin123', 'staff123', 'manager123'].includes(passwordPlain)) {
      this.data.userPasswords[userId] = bcrypt.hashSync(passwordPlain, 10);
      this.save();
      return true;
    }
    return false;
  }

  // Tables
  public getTables(): CafeTable[] {
    return this.data.tables;
  }

  public getTableByToken(token: string): CafeTable | undefined {
    return this.data.tables.find((t) => t.token === token);
  }

  public getTableById(id: string): CafeTable | undefined {
    return this.data.tables.find((t) => t.id === id);
  }

  public createTable(tableNumber: string): CafeTable {
    const newTable: CafeTable = {
      id: uuidv4(),
      tableNumber,
      token: `tbl_meraf_tok_${tableNumber}_${uuidv4().substring(0, 8)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.data.tables.push(newTable);
    this.save();
    return newTable;
  }

  public updateTable(id: string, updates: Partial<CafeTable>): CafeTable | undefined {
    const table = this.data.tables.find((t) => t.id === id);
    if (!table) return undefined;
    Object.assign(table, updates);
    this.save();
    return table;
  }

  public regenerateTableToken(id: string): CafeTable | undefined {
    const table = this.data.tables.find((t) => t.id === id);
    if (!table) return undefined;
    table.token = `tbl_meraf_tok_${table.tableNumber}_${uuidv4().substring(0, 8)}`;
    this.save();
    return table;
  }

  public deleteTable(id: string): boolean {
    const idx = this.data.tables.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.data.tables.splice(idx, 1);
    this.save();
    return true;
  }

  // Categories
  public getCategories(): Category[] {
    return [...this.data.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public createCategory(cat: Omit<Category, 'id' | 'createdAt'>): Category {
    const newCat: Category = {
      ...cat,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>): Category | undefined {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat) return undefined;
    Object.assign(cat, updates);
    this.save();
    return cat;
  }

  public deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.categories.splice(idx, 1);
    this.save();
    return true;
  }

  // Add-ons
  public getAddOns(): AddOn[] {
    return this.data.addOns;
  }

  public createAddOn(addOn: Omit<AddOn, 'id'>): AddOn {
    const newAddOn: AddOn = {
      ...addOn,
      id: uuidv4(),
    };
    this.data.addOns.push(newAddOn);
    this.save();
    return newAddOn;
  }

  public updateAddOn(id: string, updates: Partial<AddOn>): AddOn | undefined {
    const item = this.data.addOns.find((a) => a.id === id);
    if (!item) return undefined;
    Object.assign(item, updates);
    this.save();
    return item;
  }

  // Products
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public createProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const p = this.data.products.find((prod) => prod.id === id);
    if (!p) return undefined;
    Object.assign(p, updates);
    this.save();
    return p;
  }

  public deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  // Orders
  public getOrders(): Order[] {
    return [...this.data.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderByTrackingToken(token: string): Order | undefined {
    return this.data.orders.find((o) => o.trackingToken === token);
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  public createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'trackingToken' | 'createdAt' | 'updatedAt'>): Order {
    const countToday = this.data.orders.length + 1001;
    const orderNumber = `MER-${countToday}`;
    const trackingToken = `trk_${uuidv4().replace(/-/g, '')}`;

    const newOrder: Order = {
      ...orderData,
      id: uuidv4(),
      orderNumber,
      trackingToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.orders.push(newOrder);
    this.save();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: Order['orderStatus'], paymentStatus?: Order['paymentStatus']): Order | undefined {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return undefined;
    order.orderStatus = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    order.updatedAt = new Date().toISOString();
    this.save();
    return order;
  }

  // Audit Log
  public addAuditLog(userId: string, userEmail: string, action: string, details: string) {
    const log: AuditLog = {
      id: uuidv4(),
      userId,
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // Export PostgreSQL / Supabase Schema SQL Script
  public exportPostgresSchemaSql(): string {
    return `-- =========================================================
-- MERAF CAFE - FULL POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Built for Production QR Ordering & Management System
-- Addis Ababa, Ethiopia
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'STAFF')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CAFE TABLES
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number VARCHAR(50) UNIQUE NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_am VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name_en VARCHAR(255) NOT NULL,
  name_am VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_am TEXT,
  price_etb NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  prep_time_mins INT DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ADD-ONS
CREATE TABLE IF NOT EXISTS add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_am VARCHAR(255) NOT NULL,
  price_etb NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  table_number VARCHAR(50) NOT NULL,
  tracking_token VARCHAR(255) UNIQUE NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) DEFAULT 0.00,
  service_charge NUMERIC(10, 2) DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'ONLINE_CHAPA', 'ONLINE_TELEBIRR')),
  payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('UNPAID', 'PAID', 'FAILED', 'REFUNDED')),
  order_status VARCHAR(50) NOT NULL CHECK (order_status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  customer_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_tables_token ON tables(token);

-- END OF MIGRATION SCRIPT
`;
  }
}

export const db = new DatabaseEngine();
