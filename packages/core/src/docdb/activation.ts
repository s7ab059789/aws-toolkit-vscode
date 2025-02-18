/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Commands } from '../shared'
import { ExtContext } from '../shared/extensions'
import { DBResourceNode } from './explorer/dbResourceNode'
import { DocumentDBNode } from './explorer/docdbNode'
import { DBClusterNode } from './explorer/dbClusterNode'
import { DBInstanceNode } from './explorer/dbInstanceNode'
import { addRegion } from './commands/addRegion'
import { createCluster } from './commands/createCluster'
import { deleteCluster } from './commands/deleteCluster'
import { renameCluster } from './commands/renameCluster'
import { startCluster } from './commands/startCluster'
import { stopCluster } from './commands/stopCluster'
import { createInstance } from './commands/createInstance'
import { deleteInstance } from './commands/deleteInstance'
import { modifyInstance } from './commands/modifyInstance'
import { rebootInstance } from './commands/rebootInstance'
import { renameInstance } from './commands/renameInstance'
import { addTag, listTags, removeTag } from './commands/tagCommands'
import { env, Uri } from 'vscode'

/**
 * Activates DocumentDB components.
 */

export async function activate(ctx: ExtContext): Promise<void> {
    ctx.extensionContext.subscriptions.push(
        Commands.register('aws.docdb.createCluster', async (node?: DocumentDBNode) => {
            await createCluster(node)
        }),

        Commands.register('aws.docdb.deleteCluster', async (node: DBClusterNode) => {
            await deleteCluster(node)
        }),

        Commands.register('aws.docdb.renameCluster', async (node: DBClusterNode) => {
            await renameCluster(node)
        }),

        Commands.register('aws.docdb.startCluster', async (node?: DBClusterNode) => {
            await startCluster(node)
        }),

        Commands.register('aws.docdb.stopCluster', async (node?: DBClusterNode) => {
            await stopCluster(node)
        }),

        Commands.register('aws.docdb.addRegion', async (node: DBClusterNode) => {
            await addRegion(node)
        }),

        Commands.register('aws.docdb.createInstance', async (node: DBClusterNode) => {
            await createInstance(node)
        }),

        Commands.register('aws.docdb.deleteInstance', async (node: DBInstanceNode) => {
            await deleteInstance(node)
        }),

        Commands.register('aws.docdb.modifyInstance', async (node: DBInstanceNode) => {
            await modifyInstance(node)
        }),

        Commands.register('aws.docdb.rebootInstance', async (node: DBInstanceNode) => {
            await rebootInstance(node)
        }),

        Commands.register('aws.docdb.renameInstance', async (node: DBInstanceNode) => {
            await renameInstance(node)
        }),

        Commands.register('aws.docdb.listTags', async (node: DBResourceNode) => {
            await listTags(node)
        }),

        Commands.register('aws.docdb.addTag', async (node: DBResourceNode) => {
            await addTag(node)
        }),

        Commands.register('aws.docdb.removeTag', async (node: DBResourceNode) => {
            await removeTag(node)
        }),

        Commands.register('aws.docdb.openBrowser', async (node?: DBResourceNode) => {
            await node?.openInBrowser()
        }),

        Commands.register('aws.docdb.openHelp', async (node?: DBResourceNode) => {
            const url = Uri.parse('https://docs.aws.amazon.com/documentdb/latest/developerguide/get-started-guide.html')
            await env.openExternal(url)
        }),

        Commands.register('aws.docdb.copyEndpoint', async (node?: DBResourceNode) => {
            await node?.copyEndpoint()
        })
    )
}
