import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { Category, Product, AddOn } from '../../types';

export const menuRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'meraf-cafe-jwt-secret-key-addis-ababa-2026';

// Middleware for Admin/Staff Auth
function requireStaffAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Staff login required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email: string };
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  requireStaffAuth(req, res, () => {
    const userRole = (req as any).user?.role;
    if (userRole !== 'OWNER' && userRole !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden: Owner or Manager role required' });
      return;
    }
    next();
  });
}

// PUBLIC MENU DATA
menuRouter.get('/public', (req: Request, res: Response): void => {
  const categories = db.getCategories().filter((c) => !c.isHidden);
  const products = db.getProducts();
  const addOns = db.getAddOns().filter((a) => a.isActive);
  const settings = db.getSettings();

  res.json({
    categories,
    products,
    addOns,
    settings: {
      cafeName: settings.cafeName,
      logoUrl: settings.logoUrl,
      phone: settings.phone,
      address: settings.address,
      openingHoursEn: settings.openingHoursEn,
      openingHoursAm: settings.openingHoursAm,
      currency: settings.currency,
      taxRatePercent: settings.taxRatePercent,
      serviceChargePercent: settings.serviceChargePercent,
      isClosed: settings.isClosed,
      closedReasonEn: settings.closedReasonEn,
      closedReasonAm: settings.closedReasonAm,
    },
  });
});

// ADMIN CATEGORY MANAGEMENT
menuRouter.get('/categories', (req: Request, res: Response): void => {
  res.json(db.getCategories());
});

menuRouter.post('/categories', requireAdminAuth, (req: Request, res: Response): void => {
  const { nameEn, nameAm, displayOrder, isHidden } = req.body;
  if (!nameEn || !nameAm) {
    res.status(400).json({ error: 'Category English and Amharic names are required' });
    return;
  }
  const newCat = db.createCategory({
    nameEn,
    nameAm,
    displayOrder: displayOrder || 1,
    isHidden: Boolean(isHidden),
  });
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'CREATE_CATEGORY', `Created category ${nameEn}`);
  res.status(201).json(newCat);
});

menuRouter.put('/categories/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.updateCategory(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'UPDATE_CATEGORY', `Updated category ${updated.nameEn}`);
  res.json(updated);
});

menuRouter.delete('/categories/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = db.deleteCategory(id);
  if (!success) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'DELETE_CATEGORY', `Deleted category ${id}`);
  res.json({ success: true });
});

// ADMIN PRODUCT MANAGEMENT
menuRouter.get('/products', (req: Request, res: Response): void => {
  res.json(db.getProducts());
});

menuRouter.post('/products', requireAdminAuth, (req: Request, res: Response): void => {
  const {
    categoryId,
    nameEn,
    nameAm,
    descriptionEn,
    descriptionAm,
    priceEtb,
    imageUrl,
    isAvailable,
    isFeatured,
    prepTimeMins,
    variations,
    addOnIds,
  } = req.body;

  if (!categoryId || !nameEn || !nameAm || priceEtb === undefined) {
    res.status(400).json({ error: 'Category, English name, Amharic name, and Price are required' });
    return;
  }

  const newProduct = db.createProduct({
    categoryId,
    nameEn,
    nameAm,
    descriptionEn: descriptionEn || '',
    descriptionAm: descriptionAm || '',
    priceEtb: Number(priceEtb),
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
    isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    isFeatured: Boolean(isFeatured),
    prepTimeMins: Number(prepTimeMins) || 5,
    variations: variations || [],
    addOnIds: addOnIds || [],
  });

  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'CREATE_PRODUCT', `Created product ${nameEn} (${priceEtb} ETB)`);
  res.status(201).json(newProduct);
});

menuRouter.put('/products/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.updateProduct(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'UPDATE_PRODUCT', `Updated product ${updated.nameEn}`);
  res.json(updated);
});

menuRouter.patch('/products/:id/availability', requireStaffAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isAvailable } = req.body;
  const updated = db.updateProduct(id, { isAvailable: Boolean(isAvailable) });
  if (!updated) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'TOGGLE_PRODUCT_AVAILABILITY', `Set ${updated.nameEn} availability to ${isAvailable}`);
  res.json(updated);
});

menuRouter.delete('/products/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = db.deleteProduct(id);
  if (!success) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'DELETE_PRODUCT', `Deleted product ${id}`);
  res.json({ success: true });
});

// ADD-ONS
menuRouter.get('/add-ons', (req: Request, res: Response): void => {
  res.json(db.getAddOns());
});

menuRouter.post('/add-ons', requireAdminAuth, (req: Request, res: Response): void => {
  const { nameEn, nameAm, priceEtb, isActive } = req.body;
  if (!nameEn || !nameAm || priceEtb === undefined) {
    res.status(400).json({ error: 'Add-on English name, Amharic name, and Price are required' });
    return;
  }
  const newAddOn = db.createAddOn({
    nameEn,
    nameAm,
    priceEtb: Number(priceEtb),
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });
  db.addAuditLog((req as any).user.userId, (req as any).user.email, 'CREATE_ADDON', `Created add-on ${nameEn} (+${priceEtb} ETB)`);
  res.status(201).json(newAddOn);
});

menuRouter.put('/add-ons/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.updateAddOn(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Add-on not found' });
    return;
  }
  res.json(updated);
});
