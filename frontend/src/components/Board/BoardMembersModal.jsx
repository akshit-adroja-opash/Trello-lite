import { useEffect, useState } from 'react';

import {
    getBoardMembers,
    addBoardMember,
    updateBoardMemberRole,
    removeBoardMember
} from '../../api/board.api';

import {
    FiUsers,
    FiTrash2,
    FiUserPlus
} from 'react-icons/fi';
import Avatar from '../../UI/Avatar';

const BoardMembersModal = ({
    board,
    isOpen,
    onClose
}) => {

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');

    useEffect(() => {

        if (isOpen && board?._id) {
            loadBoardMembers();
        }

    }, [isOpen, board]);

    const loadBoardMembers = async () => {

        try {

            setLoading(true);

            const response =
                await getBoardMembers(board._id);

            setMembers(response.data?.members || response.data || []);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const handleAddMember = async () => {

        if (!email) return;

        try {

            await addBoardMember(
                board._id,
                { email }
            );

            setEmail('');

            loadBoardMembers();

        } catch (error) {

            console.error(error);

        }

    };

    const handleRoleUpdate = async (
        memberId,
        role
    ) => {

        try {

            await updateBoardMemberRole(
                board._id,
                memberId,
                { role }
            );

            setMembers((prev) =>
                prev.map((member) =>
                    member.user._id === memberId
                        ? {
                            ...member,
                            role
                        }
                        : member
                )
            );

        } catch (error) {

            console.error(error);

        }

    };

    const handleRemoveMember = async (
        memberId
    ) => {

        try {

            await removeBoardMember(
                board._id,
                memberId
            );

            setMembers((prev) =>
                prev.filter(
                    (member) =>
                        member.user._id !== memberId
                )
            );

        } catch (error) {

            console.error(error);

        }

    };

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">

            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

                <div className="flex items-center justify-between mb-6">

                    <div className="flex items-center gap-3">

                        <FiUsers size={24} />

                        <h2 className="text-2xl font-bold">
                            Board Members
                        </h2>

                    </div>

                    <button
                        onClick={onClose}
                        className="text-2xl"
                    >
                        ✕
                    </button>

                </div>

                <div className="mb-8">

                    <h3 className="font-semibold mb-3">
                        Add Member
                    </h3>

                    <div className="flex gap-3">

                        <input
                            type="email"
                            placeholder="Enter user email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            className="flex-1 border rounded-2xl px-4 py-3 dark:bg-zinc-800"
                        />

                        <button
                            onClick={handleAddMember}
                            className="bg-blue-600 text-white px-5 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-2"
                        >

                            <FiUserPlus />

                            Add

                        </button>

                    </div>

                </div>

                <div>

                    <h3 className="font-semibold mb-4">
                        Current Members
                    </h3>

                    {
                        loading
                            ? (
                                <p>Loading...</p>
                            )
                            : (
                                <div className="space-y-4">

                                    {
                                        members.map((member) => (

                                            <div
                                                key={member.user._id}
                                                className="border dark:border-zinc-700 rounded-2xl p-4 flex items-center justify-between"
                                            >

                                                <div className="flex items-center gap-3">
                                                    <Avatar name={member.user.username} avatar={member.user.avatar} size={36} />
                                                    <div>
                                                        <p className="font-semibold">
                                                            {member.user.username}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {member.user.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">

                                                    <select
                                                        value={member.role}
                                                        onChange={(e) =>
                                                            handleRoleUpdate(
                                                                member.user._id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="border rounded-xl px-4 py-2 dark:bg-zinc-800"
                                                    >

                                                        <option value="viewer">
                                                            Viewer
                                                        </option>

                                                        <option value="editor">
                                                            Editor
                                                        </option>

                                                        <option value="owner">
                                                            Owner
                                                        </option>

                                                    </select>

                                                    <button
                                                        onClick={() =>
                                                            handleRemoveMember(
                                                                member.user._id
                                                            )
                                                        }
                                                        className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600"
                                                    >

                                                        <FiTrash2 />

                                                    </button>

                                                </div>

                                            </div>

                                        ))
                                    }

                                </div>
                            )
                    }

                </div>

            </div>

        </div>

    );

};

export default BoardMembersModal;