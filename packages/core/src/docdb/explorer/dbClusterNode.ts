/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os'
import * as vscode from 'vscode'
import { inspect } from 'util'
import { copyToClipboard } from '../../shared/utilities/messages'
import { makeChildrenNodes } from '../../shared/treeview/utils'
import { localize } from '../../shared/utilities/vsCodeUtils'
import { telemetry } from '../../shared/telemetry'
import { CreateDBInstanceMessage, DBCluster, ModifyDBClusterMessage } from '@aws-sdk/client-docdb'
import { AWSTreeNodeBase } from '../../shared/treeview/nodes/awsTreeNodeBase'
import { DBResourceNode } from './dbResourceNode'
import { DBInstanceNode } from './dbInstanceNode'
import { PlaceholderNode } from '../../shared/treeview/nodes/placeholderNode'
import { DBInstance, DocumentDBClient } from '../../shared/clients/docdbClient'
import { DocDBContext } from './docdbContext'
import { toTitleCase } from '../../shared'

export type DBClusterRole = 'global' | 'regional' | 'primary' | 'secondary'

/**
 * An AWS Explorer node representing DocumentDB clusters.
 *
 * Contains instances for a specific cluster as child nodes.
 */
export class DBClusterNode extends DBResourceNode {
    override name = this.cluster.DBClusterIdentifier!
    override arn = this.cluster.DBClusterArn!
    public instances: DBInstance[] = []

    constructor(
        public readonly parent: AWSTreeNodeBase,
        readonly cluster: DBCluster,
        client: DocumentDBClient,
        readonly clusterRole: DBClusterRole = 'regional'
    ) {
        super(client, cluster.DBClusterIdentifier ?? '[Cluster]', vscode.TreeItemCollapsibleState.Collapsed)
        this.arn = cluster.DBClusterArn ?? ''
        this.name = cluster.DBClusterIdentifier ?? ''
        this.contextValue = this.getContext()
        this.iconPath = new vscode.ThemeIcon(
            this.isAvailable ? 'layers-active' : this.isStopped ? 'layers-dot' : 'loading~spin'
        )
        this.description = this.getDescription()
        this.tooltip = `${this.name}${os.EOL}Engine: ${this.cluster.EngineVersion}${os.EOL}Status: ${this.cluster.Status}`
    }

    public override async getChildren(): Promise<AWSTreeNodeBase[]> {
        return telemetry.docdb_listInstances.run(async () => {
            return await makeChildrenNodes({
                getChildNodes: async () => {
                    this.instances = (await this.client.listInstances([this.arn])).map((i) => {
                        const member = this.cluster.DBClusterMembers?.find(
                            (m) => m.DBInstanceIdentifier === i.DBInstanceIdentifier
                        )
                        return { ...i, ...member }
                    })
                    const nodes = this.instances.map((instance) => new DBInstanceNode(this, instance))
                    return nodes
                },
                getNoChildrenPlaceholderNode: async () => {
                    const title = localize('AWS.explorerNode.docdb.addInstance', 'Add instance...')
                    const placeholder = new PlaceholderNode(this, title)
                    placeholder.contextValue = 'awsDocDB.placeholder'
                    placeholder.command = { title, command: 'aws.docdb.createInstance', arguments: [this] }
                    return placeholder
                },
                sort: (item1, item2) => item1.name.localeCompare(item2.name),
            })
        })
    }

    private getContext() {
        const context = `${DocDBContext.Cluster}-${this.clusterRole}`
        if (this.isAvailable) {
            return `${context}-running`
        } else if (this.isStopped) {
            return `${context}-stopped`
        }
        return context
    }

    public getDescription(): string | boolean {
        const role = toTitleCase(this.clusterRole)
        if (!this.isAvailable) {
            return `${role} cluster • ${toTitleCase(this.status ?? ' ')}`
        }
        return `${role} cluster`
    }

    public async createInstance(request: CreateDBInstanceMessage): Promise<DBInstance | undefined> {
        return await this.client.createInstance(request)
    }

    public async renameCluster(clusterName: string): Promise<DBCluster | undefined> {
        const request: ModifyDBClusterMessage = {
            DBClusterIdentifier: this.cluster.DBClusterIdentifier,
            NewDBClusterIdentifier: clusterName,
            ApplyImmediately: true,
        }
        const response = await this.client.modifyCluster(request)
        this.name = response?.DBClusterIdentifier ?? this.name
        return response
    }

    public async deleteCluster(finalSnapshotId: string | undefined): Promise<DBCluster | undefined> {
        const instances = await this.client.listInstances([this.arn])

        const tasks = []
        for (const instance of instances) {
            tasks.push(
                this.client.deleteInstance({
                    DBInstanceIdentifier: instance.DBInstanceIdentifier,
                })
            )
        }
        await Promise.all(tasks)

        return await this.client.deleteCluster({
            DBClusterIdentifier: this.cluster.DBClusterIdentifier,
            FinalDBSnapshotIdentifier: finalSnapshotId,
            SkipFinalSnapshot: finalSnapshotId === undefined,
        })
    }

    override get status() {
        return this.cluster.Status
    }

    override async getStatus() {
        const [cluster] = await this.client.listClusters(this.id)
        return cluster.Status
    }

    override getConsoleUrl() {
        const region = this.regionCode
        return vscode.Uri.parse(
            `https://${region}.console.aws.amazon.com/docdb/home?region=${region}#cluster-details/${this.name}`
        )
    }

    override copyEndpoint() {
        if (this.cluster.Endpoint) {
            return copyToClipboard(this.cluster.Endpoint, this.name)
        }
        return Promise.reject()
    }

    public [inspect.custom](): string {
        return 'DBClusterNode'
    }
}
