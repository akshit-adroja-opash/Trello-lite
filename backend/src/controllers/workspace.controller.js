import Workspace from '../models/Workspace.js';

export const createWorkspace = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const workspace = await Workspace.create({
            name,
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'admin' }]
        });
        res.status(201).json({ status: 'success', data: { workspace } });
    } catch (error) {
        next(error);
    }
};

export const getWorkspaces = async (req, res, next) => {
    try {
        const workspaces = await Workspace.find({ 'members.user': req.user._id });
        res.status(200).json({ status: 'success', data: { workspaces } });
    } catch (error) {
        next(error);
    }
};
// ### Workspace APIs
// - Invite workspace members by email
// - Add workspace member management endpoints
//   - `POST /api/v1/workspaces/:workspaceId/invite`
//   - `GET /api/v1/workspaces/:workspaceId/members`
//   - `PATCH /api/v1/workspaces/:workspaceId/members/:memberId` (role updates)
//   - `DELETE /api/v1/workspaces/:workspaceId/members/:memberId`
// - Update workspace details
//   - `PATCH /api/v1/workspaces/:workspaceId`
// - Delete workspace
//   - `DELETE /api/v1/workspaces/:workspaceId`

export const inviteMember = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const { email, role } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return next(new ApiError(404, 'Workspace not found'));
        }
        if (workspace.owner.toString() !== req.user._id.toString()) {   
            return next(new ApiError(403, 'You are not the owner of this workspace'));
        }
        
    } catch (error) {
        next(error);
    }
};

export const getMembers = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email');
        if (!workspace) {
            return next(new ApiError(404, 'Workspace not found'));
        }
        if (!workspace.members.some(m => m.user._id.toString() === req.user._id.toString())) {
            return next(new ApiError(403, 'You are not a member of this workspace'));
        }

        res.status(200).json({ status: 'success', data: { members: workspace.members } });
    } catch (error) {
        next(error);
    }
};

export const updateMemberRole = async (req, res, next) => {
    try {
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return next(new ApiError(404, 'Workspace not found'));
        }
        if (workspace.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError(403, 'You are not the owner of this workspace'));
        }

        const member = workspace.members.id(memberId);
        if (!member) {
            return next(new ApiError(404, 'Member not found'));
        }

        member.role = role;
        await workspace.save();

        res.status(200).json({ status: 'success', data: { member } });
    } catch (error) {
        next(error);
    }
};

export const removeMember = async (req, res, next) => {
    try {
        const { workspaceId, memberId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return next(new ApiError(404, 'Workspace not found'));
        }
        if (workspace.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError(403, 'You are not the owner of this workspace'));
        }

        const member = workspace.members.id(memberId);
        if (!member) {
            return next(new ApiError(404, 'Member not found'));
        }

        member.remove();
        await workspace.save();

        res.status(200).json({ status: 'success', message: 'Member removed successfully' });
    } catch (error) {
        next(error);
    }
};  


export const updateWorkspace = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;
        const { name, description } = req.body;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return next(new ApiError(404, 'Workspace not found'));
        }

        // Only owner can update workspace
        if (workspace.owner.toString() !== req.user._id.toString()) {
            return next(
                new ApiError(403, 'You are not the owner of this workspace')
            );
        }

        // Update fields
        if (name) workspace.name = name;
        if (description) workspace.description = description;

        await workspace.save();

        res.status(200).json({
            status: 'success',
            message: 'Workspace updated successfully',
            data: { workspace }
        });
    } catch (error) {
        next(error);
    }
};



export const deleteWorkspace = async (req, res, next) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return next(new ApiError(404, 'Workspace not found'));
        }

        // Only owner can delete workspace
        if (workspace.owner.toString() !== req.user._id.toString()) {
            return next(
                new ApiError(403, 'You are not the owner of this workspace')
            );
        }

        await workspace.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Workspace deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};