import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth';
import FamilyGroupModel from '../models/familyGroup';
import ChildProgressModel from '../models/childProgress';

const router = Router();

// POST /api/family/create - Create family group
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Group name required' });
    }

    const existing = await FamilyGroupModel.findOne({ admin: userId, type: 'family' });
    if (existing) {
      return res.status(400).json({ success: false, error: 'You already have a family group' });
    }

    const inviteCode = uuidv4().slice(0, 8).toUpperCase();
    const group = await FamilyGroupModel.create({
      name,
      type: 'family',
      admin: userId,
      members: [{ user: userId, role: 'admin', joinedAt: new Date() }],
      inviteCode,
      description,
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error('Create family error:', err);
    res.status(500).json({ success: false, error: 'Failed to create family group' });
  }
});

// POST /api/family/join - Join by invite code
router.post('/join', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Invite code required' });
    }

    const group = await FamilyGroupModel.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    const alreadyMember = group.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, error: 'Already a member' });
    }

    group.members.push({ user: userId as any, role: 'member', joinedAt: new Date() });
    await group.save();

    res.json({ success: true, data: group, message: 'Joined family group' });
  } catch (err) {
    console.error('Join family error:', err);
    res.status(500).json({ success: false, error: 'Failed to join family group' });
  }
});

// GET /api/family/my - Get user's family group
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const group = await FamilyGroupModel.findOne({
      type: 'family',
      'members.user': userId,
    }).populate('members.user', 'name email').exec();

    if (!group) {
      return res.status(404).json({ success: false, error: 'No family group found' });
    }

    res.json({ success: true, data: group });
  } catch (err) {
    console.error('Get family error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch family group' });
  }
});

// POST /api/family/child/add
router.post('/child/add', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { childName } = req.body;
    if (!childName) {
      return res.status(400).json({ success: false, error: 'childName required' });
    }

    const group = await FamilyGroupModel.findOne({ admin: userId, type: 'family' });
    if (!group) {
      return res.status(400).json({ success: false, error: 'Create a family group first' });
    }

    const alreadyChild = group.members.some(m => m.role === 'child' && (m as any).name === childName);
    if (!alreadyChild) {
      group.members.push({ user: userId as any, role: 'child', joinedAt: new Date() });
      (group.members[group.members.length - 1] as any).name = childName;
      await group.save();
    }

    res.json({ success: true, data: group, message: `Child ${childName} added` });
  } catch (err) {
    console.error('Add child error:', err);
    res.status(500).json({ success: false, error: 'Failed to add child' });
  }
});

// GET /api/family/children
router.get('/children', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const group = await FamilyGroupModel.findOne({ admin: userId, type: 'family' });
    if (!group) {
      return res.json({ success: true, data: [] });
    }

    const children = group.members.filter(m => m.role === 'child').map(m => ({ name: m.user }));
    res.json({ success: true, data: children });
  } catch (err) {
    console.error('Get children error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch children' });
  }
});

// POST /api/family/child/progress
router.post('/child/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { childName, surahNumber, ayahNumber, status } = req.body;
    if (!childName || !surahNumber || !ayahNumber || !status) {
      return res.status(400).json({ success: false, error: 'childName, surahNumber, ayahNumber, and status required' });
    }

    const progress = await ChildProgressModel.findOneAndUpdate(
      { parentUser: userId, childName, surahNumber, ayahNumber },
      { parentUser: userId, childName, surahNumber, ayahNumber, status, lastPracticed: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: progress, message: 'Child progress saved' });
  } catch (err) {
    console.error('Child progress error:', err);
    res.status(500).json({ success: false, error: 'Failed to save child progress' });
  }
});

// GET /api/family/child/progress/:childName
router.get('/child/progress/:childName', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { childName } = req.params;

    const progress = await ChildProgressModel.find({ parentUser: userId, childName }).sort({ surahNumber: 1, ayahNumber: 1 }).lean();
    res.json({ success: true, data: progress });
  } catch (err) {
    console.error('Get child progress error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch child progress' });
  }
});

// POST /api/family/halaqat/create
router.post('/halaqat/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Halaqat name required' });
    }

    const inviteCode = uuidv4().slice(0, 8).toUpperCase();
    const group = await FamilyGroupModel.create({
      name,
      type: 'halaqat',
      admin: userId,
      members: [{ user: userId, role: 'admin', joinedAt: new Date() }],
      inviteCode,
      description,
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error('Create halaqat error:', err);
    res.status(500).json({ success: false, error: 'Failed to create halaqat' });
  }
});

// POST /api/family/halaqat/join
router.post('/halaqat/join', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Invite code required' });
    }

    const group = await FamilyGroupModel.findOne({ inviteCode: inviteCode.toUpperCase(), type: 'halaqat' });
    if (!group) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    const alreadyMember = group.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, error: 'Already a member' });
    }

    group.members.push({ user: userId as any, role: 'member', joinedAt: new Date() });
    await group.save();

    res.json({ success: true, data: group, message: 'Joined halaqat' });
  } catch (err) {
    console.error('Join halaqat error:', err);
    res.status(500).json({ success: false, error: 'Failed to join halaqat' });
  }
});

// GET /api/family/halaqat/my
router.get('/halaqat/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const groups = await FamilyGroupModel.find({
      type: 'halaqat',
      'members.user': userId,
    }).populate('members.user', 'name email').populate('admin', 'name email').exec();

    res.json({ success: true, data: groups });
  } catch (err) {
    console.error('Get halaqat error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch halaqat' });
  }
});

// DELETE /api/family/group/:id
router.delete('/group/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const group = await FamilyGroupModel.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Admin can delete, members can leave
    if (group.admin.toString() === userId) {
      await FamilyGroupModel.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Group deleted' });
    }

    // Remove self from members
    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();
    res.json({ success: true, message: 'Left the group' });
  } catch (err) {
    console.error('Delete/leave group error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete/leave group' });
  }
});

export default router;
