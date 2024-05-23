import React, {useCallback, useMemo} from 'react';
import {View} from 'react-native';
import BlockingView from '@components/BlockingViews/BlockingView';
import * as Illustrations from '@components/Icon/Illustrations';
import RadioListItem from '@components/SelectionList/RadioListItem';
import type {SelectorType} from '@components/SelectionScreen';
import SelectionScreen from '@components/SelectionScreen';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as Connections from '@libs/actions/connections';
import Navigation from '@libs/Navigation/Navigation';
import type {WithPolicyConnectionsProps} from '@pages/workspace/withPolicyConnections';
import withPolicyConnections from '@pages/workspace/withPolicyConnections';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';

function XeroInvoiceAccountSelectorPage({policy}: WithPolicyConnectionsProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    const policyID = policy?.id ?? '';
    const {bankAccounts} = policy?.connections?.xero?.data ?? {};

    const {invoiceCollectionsAccountID, syncReimbursedReports} = policy?.connections?.xero?.config.sync ?? {};

    const xeroSelectorOptions = useMemo<SelectorType[]>(
        () =>
            (bankAccounts ?? []).map(({id, name}) => ({
                value: id,
                text: name,
                keyForList: id,
                isSelected: invoiceCollectionsAccountID === id,
            })),
        [invoiceCollectionsAccountID, bankAccounts],
    );

    const listHeaderComponent = useMemo(
        () => (
            <View style={[styles.pb2, styles.ph5]}>
                <Text style={[styles.pb5, styles.textNormal]}>{translate('workspace.xero.advancedConfig.invoiceAccountSelectorDescription')}</Text>
            </View>
        ),
        [translate, styles.pb2, styles.ph5, styles.pb5, styles.textNormal],
    );

    const initiallyFocusedOptionKey = useMemo(() => xeroSelectorOptions?.find((mode) => mode.isSelected)?.keyForList, [xeroSelectorOptions]);

    const updateAccount = useCallback(
        ({value}: SelectorType) => {
            Connections.updatePolicyConnectionConfig(policyID, CONST.POLICY.CONNECTIONS.NAME.XERO, CONST.XERO_CONFIG.SYNC, {
                invoiceCollectionsAccountID: value,
            });
            Navigation.goBack(ROUTES.POLICY_ACCOUNTING_XERO_ADVANCED.getRoute(policyID));
        },
        [policyID],
    );

    const listEmptyContent = useMemo(
        () => (
            <BlockingView
                icon={Illustrations.TeleScope}
                iconWidth={variables.emptyListIconWidth}
                iconHeight={variables.emptyListIconHeight}
                title={translate('workspace.xero.noAccountsFound')}
                subtitle={translate('workspace.xero.noAccountsFoundDescription')}
            />
        ),
        [translate],
    );

    return (
        <SelectionScreen
            policyID={policyID}
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
            displayName={XeroInvoiceAccountSelectorPage.displayName}
            sections={xeroSelectorOptions.length ? [{data: xeroSelectorOptions}] : []}
            listItem={RadioListItem}
            shouldBeBlocked={!syncReimbursedReports}
            onSelectRow={updateAccount}
            initiallyFocusedOptionKey={initiallyFocusedOptionKey}
            headerContent={listHeaderComponent}
            onBackButtonPress={() => Navigation.goBack(ROUTES.POLICY_ACCOUNTING_XERO_ADVANCED.getRoute(policyID))}
            title="workspace.xero.advancedConfig.xeroInvoiceCollectionAccount"
            listEmptyContent={listEmptyContent}
        />
    );
}

XeroInvoiceAccountSelectorPage.displayName = 'XeroInvoiceAccountSelectorPage';

export default withPolicyConnections(XeroInvoiceAccountSelectorPage);
