const fs = require('fs');
const path = require('path');

const apiFunctions = [
    'registerUser', 'loginUser', 'logoutUser', 'getMe', 'updateProfile', 'getDevelopers', 'deleteAccount',
    'createWorkspace', 'getWorkspaces', 'inviteMember', 'getWorkspaceMembers', 'updateMemberRole', 'removeMember', 'updateWorkspace', 'deleteWorkspace', 'getOverdueCount',
    'createBoard', 'getBoardsByWorkspace', 'getSingleBoard', 'updateBoard', 'deleteBoard', 'getBoardMembers', 'addBoardMember', 'updateBoardMemberRole', 'removeBoardMember', 'toggleStarBoard',
    'createColumn', 'getColumnsByBoard', 'reorderColumn', 'updateColumn', 'deleteColumn',
    'createCard', 'getCardsByColumn', 'getMyTasks', 'getSingleCard', 'updateCard', 'deleteCard', 'moveCard', 'getCardActivities', 'addComment', 'toggleCommentReaction', 'saveCardAsTemplate', 'getBoardTemplates',
    'getBoardActivities',
    'fetchNotifications', 'markAllAsRead', 'markAsRead',
    'getWorkspaceAnalytics',
    'generateFullReport', 'generateClientReport', 'shareReportLink', 'downloadSharedReport'
];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                // Ignore api directory to avoid counting the definition
                if (!dirPath.includes('frontend/src/api') && !dirPath.includes('frontend\\src\\api')) {
                    arrayOfFiles.push(path.join(dirPath, "/", file));
                }
            }
        }
    });

    return arrayOfFiles;
}

const frontendSrcPath = path.join(__dirname, 'frontend', 'src');
const allFiles = getAllFiles(frontendSrcPath);

const usageCount = {};
apiFunctions.forEach(fn => usageCount[fn] = 0);

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    apiFunctions.forEach(fn => {
        if (content.includes(fn)) {
            usageCount[fn]++;
        }
    });
});

const unusedAPIs = apiFunctions.filter(fn => usageCount[fn] === 0);
console.log("Unused API functions in frontend UI:");
unusedAPIs.forEach(fn => console.log("- " + fn));
