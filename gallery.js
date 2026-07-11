// js/gallery.js

const gallery =
    document.getElementById("gallery");

const emptyState =
    document.getElementById("emptyState");

const createProjectBtn =
    document.getElementById(
        "createProjectBtn"
    );

window.addEventListener(
    "DOMContentLoaded",
    initGallery
);

async function initGallery() {

    try {

        await dbManager.init();

        bindEvents();

        await renderProjects();

        console.log(
            "Gallery initialized"
        );

    }
    catch(error){

        console.error(error);

        alert(
            "初期化エラー:\n" +
            error.message
        );

    }

}

function bindEvents() {

    createProjectBtn.onclick =
    async () => {

        try {

            const project =
            await dbManager.createProject({

                title:
                "無題の作品",

                width:1200,

                height:700

            });

            console.log(
                "created",
                project
            );

            location.href =
            `editor.html?id=${project.id}`;

        }
        catch(error){

            console.error(error);

            alert(
                "作品作成エラー:\n" +
                error.message
            );

        }

    };

}

async function renderProjects() {

    try {

        const projects =
        await dbManager
        .getAllProjects();

        gallery.innerHTML = "";

        if (
            projects.length === 0
        ) {

            emptyState.style.display =
            "block";

            return;

        }

        emptyState.style.display =
        "none";

        projects.forEach(
            project => {

                gallery.appendChild(
                    createProjectCard(
                        project
                    )
                );

            }
        );

    }
    catch(error){

        console.error(error);

        alert(
            "一覧取得エラー:\n" +
            error.message
        );

    }

}

function createProjectCard(
    project
) {

    const card =
    document.createElement(
        "div"
    );

    card.className =
    "projectCard";

    const thumb =
    project.thumbnail || "";

    card.innerHTML = `

<img
class="projectThumbnail"
src="${thumb}"
alt="thumbnail">

<div class="projectInfo">

<div class="projectTitle">
${escapeHtml(
    project.title
)}
</div>

<div class="projectDate">
更新:
${formatDate(
    project.updatedAt
)}
</div>

<div class="projectActions">

<button
class="editBtn">
編集
</button>

<button
class="copyBtn">
複製
</button>

<button
class="deleteBtn">
削除
</button>

</div>

</div>

`;

    const editBtn =
    card.querySelector(
        ".editBtn"
    );

    const copyBtn =
    card.querySelector(
        ".copyBtn"
    );

    const deleteBtn =
    card.querySelector(
        ".deleteBtn"
    );

    editBtn.onclick =
    () => {

        location.href =
        `editor.html?id=${project.id}`;

    };

    copyBtn.onclick =
    async () => {

        try {

            await dbManager
            .duplicateProject(
                project.id
            );

            await renderProjects();

        }
        catch(error){

            console.error(error);

            alert(
                "複製エラー"
            );

        }

    };

    deleteBtn.onclick =
    async () => {

        const ok =
        confirm(
            `「${project.title}」を削除しますか？`
        );

        if(!ok){
            return;
        }

        try {

            await dbManager
            .deleteProject(
                project.id
            );

            await renderProjects();

        }
        catch(error){

            console.error(error);

            alert(
                "削除エラー"
            );

        }

    };

    return card;

}

function formatDate(
    timestamp
) {

    return new Date(
        timestamp
    ).toLocaleString(
        "ja-JP"
    );

}

function escapeHtml(
    text
) {

    const div =
    document.createElement(
        "div"
    );

    div.textContent =
    text;

    return div.innerHTML;

}