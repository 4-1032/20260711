// db.js

const DB_NAME = "IllustrationStudioDB";
const DB_VERSION = 1;
const PROJECT_STORE = "projects";

class DBManager {

    constructor() {
        this.db = null;
    }

    async init() {

        if (this.db) {
            return;
        }

        return new Promise((resolve, reject) => {

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );

            request.onupgradeneeded = (event) => {

                const db =
                    event.target.result;

                if (
                    !db.objectStoreNames.contains(
                        PROJECT_STORE
                    )
                ) {

                    const store =
                        db.createObjectStore(
                            PROJECT_STORE,
                            {
                                keyPath: "id"
                            }
                        );

                    store.createIndex(
                        "updatedAt",
                        "updatedAt",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "title",
                        "title",
                        {
                            unique: false
                        }
                    );

                }

            };

            request.onsuccess = () => {

                this.db =
                    request.result;

                resolve();

            };

            request.onerror = () => {

                reject(
                    request.error
                );

            };

        });

    }

    async saveProject(project) {

        await this.init();

        return new Promise((resolve, reject) => {

            const tx =
                this.db.transaction(
                    PROJECT_STORE,
                    "readwrite"
                );

            const store =
                tx.objectStore(
                    PROJECT_STORE
                );

            const request =
                store.put(project);

            request.onsuccess =
                () => resolve();

            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        });

    }

    async getProject(id) {

        await this.init();

        return new Promise((resolve, reject) => {

            const tx =
                this.db.transaction(
                    PROJECT_STORE,
                    "readonly"
                );

            const store =
                tx.objectStore(
                    PROJECT_STORE
                );

            const request =
                store.get(id);

            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );

            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        });

    }

    async getAllProjects() {

        await this.init();

        return new Promise((resolve, reject) => {

            const tx =
                this.db.transaction(
                    PROJECT_STORE,
                    "readonly"
                );

            const store =
                tx.objectStore(
                    PROJECT_STORE
                );

            const request =
                store.getAll();

            request.onsuccess =
                () => {

                    const projects =
                        request.result
                        .sort(
                            (a, b) =>
                                b.updatedAt -
                                a.updatedAt
                        );

                    resolve(
                        projects
                    );

                };

            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        });

    }

    async deleteProject(id) {

        await this.init();

        return new Promise((resolve, reject) => {

            const tx =
                this.db.transaction(
                    PROJECT_STORE,
                    "readwrite"
                );

            const store =
                tx.objectStore(
                    PROJECT_STORE
                );

            const request =
                store.delete(id);

            request.onsuccess =
                () => resolve();

            request.onerror =
                () =>
                    reject(
                        request.error
                    );

        });

    }

    async duplicateProject(id) {

        const original =
            await this.getProject(
                id
            );

        if (!original) {
            return null;
        }

        const copy = {

            ...original,

            id:
                crypto.randomUUID(),

            title:
                original.title +
                " (コピー)",

            createdAt:
                Date.now(),

            updatedAt:
                Date.now()

        };

        await this.saveProject(
            copy
        );

        return copy;

    }

    async projectExists(id) {

        const project =
            await this.getProject(id);

        return !!project;

    }

    async createProject({
        title = "無題の作品",
        width = 1200,
        height = 700
    } = {}) {

        const project = {

            id:
                crypto.randomUUID(),

            title,

            createdAt:
                Date.now(),

            updatedAt:
                Date.now(),

            width,

            height,

            thumbnail: null,

            layers: []

        };

        await this.saveProject(
            project
        );

        return project;

    }

}

const dbManager =
    new DBManager();