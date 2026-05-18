import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Card, CardContent, Chip, LinearProgress, Tooltip,
    AvatarGroup, Avatar as MuiAvatar, Typography, Box, Stack
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChecklistIcon from '@mui/icons-material/Checklist';
import NotesIcon from '@mui/icons-material/Notes';
import CardDetail from './CardDetail';

const CardItem = ({ card, columnId, isDragging: externalDragging }) => {
    const [open, setOpen] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card._id,
        data: { type: 'card', card, columnId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || externalDragging ? 0.4 : 1,
        marginBottom: 12,
        width: '100%',
    };

    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
    const isDueSoon = card.dueDate && !isOverdue && (new Date(card.dueDate) - new Date()) < 86400000 * 2;
    const doneItems  = card.checklist?.filter(i => i.done).length || 0;
    const totalItems = card.checklist?.length || 0;
    const progress   = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    const firstColor = card.labels?.[0]?.color;

    return (
        <>
            <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <Card
                    onClick={() => setOpen(true)}
                    elevation={0}
                    sx={{
                        cursor: 'grab',
                        '&:active': { cursor: 'grabbing' },
                        borderRadius: 3,
                        background: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderTop: firstColor ? `4px solid ${firstColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        userSelect: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                            background: 'rgba(30, 41, 59, 0.9)',
                            borderColor: 'rgba(99, 102, 241, 0.6)',
                            transform: 'translateY(-3px)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                        },
                    }}
                >
                    <CardContent sx={{ p: '16px !important' }}>

                        {/* Label chips */}
                        {card.labels?.length > 0 && (
                            <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1.5}>
                                {card.labels.map((l, i) => (
                                    <Chip
                                        key={i}
                                        label={l.name}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            bgcolor: `${l.color}25`,
                                            color: l.color,
                                            border: `1px solid ${l.color}40`,
                                            '& .MuiChip-label': { px: 1.2 },
                                        }}
                                    />
                                ))}
                            </Stack>
                        )}

                        {/* Title */}
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.92)',
                                fontSize: '0.875rem',
                                letterSpacing: '0.01em',
                                lineHeight: 1.5,
                                mb: totalItems > 0 ? 1.5 : 0,
                                '&:hover': { color: '#fff' },
                            }}
                        >
                            {card.title || "Untitled Task"}
                        </Typography>

                        {/* Checklist progress */}
                        {totalItems > 0 && (
                            <Box mb={2}>
                                <Stack direction="row" justifyContent="space-between" mb={0.75}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: 500 }}>
                                        {doneItems}/{totalItems} tasks
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontWeight: 600 }}>
                                        {progress}%
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{
                                        height: 5,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 2,
                                            background: progress === 100
                                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                                : 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                        },
                                    }}
                                />
                            </Box>
                        )}

                        {/* Meta row */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            mt={card.labels?.length || totalItems > 0 ? 0 : 1}
                            pt={1.5}
                            sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
                        >
                            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">

                                {/* Due date */}
                                {card.dueDate && (
                                    <Tooltip title={isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : 'Due date'}>
                                        <Chip
                                            icon={<CalendarTodayIcon sx={{ fontSize: '12px !important' }} />}
                                            label={new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            size="small"
                                            sx={{
                                                height: 22,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                ...(isOverdue
                                                    ? { bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' }
                                                    : isDueSoon
                                                    ? { bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' }
                                                    : { bgcolor: 'rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)' }),
                                                '& .MuiChip-label': { px: 1 },
                                                '& .MuiChip-icon': { ml: 0.5, color: 'inherit' },
                                            }}
                                        />
                                    </Tooltip>
                                )}

                                {/* Checklist badge */}
                                {totalItems > 0 && (
                                    <Chip
                                        icon={<ChecklistIcon sx={{ fontSize: '12px !important' }} />}
                                        label={`${doneItems}/${totalItems}`}
                                        size="small"
                                        sx={{
                                            height: 22,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            ...(doneItems === totalItems
                                                ? { bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }
                                                : { bgcolor: 'rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)' }),
                                            '& .MuiChip-label': { px: 1 },
                                            '& .MuiChip-icon': { ml: 0.5, color: 'inherit' },
                                        }}
                                    />
                                )}

                                {/* Description icon */}
                                {card.description && (
                                    <Tooltip title="Has description">
                                        <NotesIcon sx={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.4)', ml: 0.5 }} />
                                    </Tooltip>
                                )}
                            </Stack>

                            {/* Assignee avatars */}
                            {card.assignees?.length > 0 && (
                                <AvatarGroup
                                    max={3}
                                    sx={{
                                        '& .MuiAvatar-root': {
                                            width: 24,
                                            height: 24,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            border: '2px solid #1e293b',
                                        },
                                    }}
                                >
                                    {card.assignees.map(a => (
                                        <Tooltip key={a._id || a} title={a.username || '?'}>
                                            <MuiAvatar
                                                src={a.avatar}
                                                alt={a.username || '?'}
                                                sx={{ bgcolor: '#4f46e5' }}
                                            >
                                                {(a.username || '?').charAt(0).toUpperCase()}
                                            </MuiAvatar>
                                        </Tooltip>
                                    ))}
                                </AvatarGroup>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {open && <CardDetail card={card} columnId={columnId} onClose={() => setOpen(false)} />}
        </>
    );
};

export default CardItem;