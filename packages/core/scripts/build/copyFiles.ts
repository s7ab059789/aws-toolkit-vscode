/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-restricted-imports */
import fs from 'fs'
import * as path from 'path'
import { createInstallQNode, createLearnMoreNode, createDismissNode } from 'src/amazonq/explorer/amazonQChildrenNodes'
import { undefined } from 'src/amazonq/explorer/amazonQTreeNode'
import { AuthState } from 'src/codewhisperer'
import { Commands } from 'src/shared'
import { TreeNode, ResourceTreeDataProvider } from 'src/shared/treeview/resourceTreeDataProvider'
/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode'

// Moves all dependencies into `dist`

const projectRoot = process.cwd()
const outRoot = path.join(projectRoot, 'dist')

// The target file or directory must exist, otherwise we should fail the whole build.
interface CopyTask {
    /**
     * Target file or directory to copy.
     */
    readonly target: string

    /**
     * Providing no destination means the target will be copied relative to the root directory.
     */
    readonly destination?: string
}

const tasks: CopyTask[] = [
    { target: path.join('src', 'templates') },
    { target: path.join('src', 'test', 'shared', 'cloudformation', 'yaml') },
    { target: path.join('src', 'testFixtures') },
    { target: 'src/auth/sso/vue' },

    // SSM
    {
        target: path.join('../../node_modules', 'aws-ssm-document-language-service', 'dist', 'server.js'),
        destination: path.join('src', 'ssmDocument', 'ssm', 'ssmServer.js'),
    },
    {
        target: path.join('../../node_modules', 'aws-ssm-document-language-service', 'dist', 'server.js.LICENSE.txt'),
        destination: path.join('src', 'ssmDocument', 'ssm', 'ssmServer.js.LICENSE.txt'),
    },
    {
        target: path.join('../../node_modules', 'aws-ssm-document-language-service', 'dist', 'server.js.map'),
        destination: path.join('src', 'ssmDocument', 'ssm', 'server.js.map'),
    },
]

function copy(task: CopyTask): void {
    const src = path.resolve(projectRoot, task.target)
    const dst = path.resolve(outRoot, task.destination ?? task.target)

    try {
        fs.cpSync(src, dst, {
            recursive: true,
            force: true,
            errorOnExist: false,
        })
    } catch (error) {
        throw new Error(`Copy "${src}" to "${dst}" failed: ${error instanceof Error ? error.message : error}`)
    }
}
function main() {
    try {
        tasks.map(copy)
    } catch (error) {
        console.error('`copyFiles.ts` failed')
        console.error(error)
        process.exit(1)
    }
}

void main()
export class AmazonQNode implements TreeNode {
    public readonly id = 'amazonq';
    public readonly resource = this;
    private readonly onDidChangeChildrenEmitter = new vscode.EventEmitter<void>();
    private readonly onDidChangeTreeItemEmitter = new vscode.EventEmitter<void>();
    public readonly onDidChangeTreeItem = this.onDidChangeTreeItemEmitter.event;
    public readonly onDidChangeChildren = this.onDidChangeChildrenEmitter.event;
    private readonly onDidChangeVisibilityEmitter = new vscode.EventEmitter<void>();
    public readonly onDidChangeVisibility = this.onDidChangeVisibilityEmitter.event;

    public static amazonQState: AuthState

    private constructor() { }

    public getTreeItem() {
        const item = new vscode.TreeItem('Amazon Q')
        item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed
        item.contextValue = 'awsAmazonQNode'

        return item
    }

    public refresh(): void {
        this.onDidChangeChildrenEmitter.fire()
    }

    public refreshRootNode() {
        this.onDidChangeTreeItemEmitter.fire()
    }

    public getChildren() {
        const children = [createInstallQNode(), createLearnMoreNode(), createDismissNode()]
        return children
    }

    /**
     * HACK: Since this is assumed to be an immediate child of the
     * root, we return undefined.
     *
     * TODO: Look to have a base root class to extend so we do not
     * need to implement this here.
     * @returns
     */
    getParent(): TreeNode<unknown> | undefined {
        return undefined
    }

    static #instance: AmazonQNode

    static get instance(): AmazonQNode {
        return (this.#instance ??= new AmazonQNode())
    }
}
/**
 * Refreshes the Amazon Q Tree node. If Amazon Q's connection state is provided, it will also internally
 * update the connection state.
 *
 * This command is meant to be called by Amazon Q. It doesn't serve much purpose being called otherwise.
 */

export const refreshAmazonQ = (provider?: ResourceTreeDataProvider) => Commands.register({ id: '_aws.toolkit.amazonq.refreshTreeNode', logging: false }, () => {
    AmazonQNode.instance.refresh()
    if (provider) {
        provider.refresh()
    }
})

export const refreshAmazonQRootNode = (provider?: ResourceTreeDataProvider) => Commands.register({ id: '_aws.amazonq.refreshRootNode', logging: false }, () => {
    AmazonQNode.instance.refreshRootNode()
    if (provider) {
        provider.refresh()
    }
})
