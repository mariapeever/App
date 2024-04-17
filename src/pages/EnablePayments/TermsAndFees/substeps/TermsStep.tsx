import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import CheckboxWithLabel from '@components/CheckboxWithLabel';
import FormAlertWithSubmitButton from '@components/FormAlertWithSubmitButton';
import ScrollView from '@components/ScrollView';
import Text from '@components/Text';
import TextLink from '@components/TextLink';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ErrorUtils from '@libs/ErrorUtils';
import * as BankAccounts from '@userActions/BankAccounts';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';

function HaveReadAndAgreeLabel() {
    const {translate} = useLocalize();

    return (
        <Text>
            {`${translate('termsStep.haveReadAndAgree')}`}
            <TextLink href={CONST.ELECTRONIC_DISCLOSURES_URL}>{`${translate('termsStep.electronicDisclosures')}.`}</TextLink>
        </Text>
    );
}

function AgreeToTheLabel() {
    const {translate} = useLocalize();

    return (
        <Text>
            {`${translate('termsStep.agreeToThe')} `}
            <TextLink href={CONST.PRIVACY_URL}>{`${translate('common.privacy')} `}</TextLink>
            {`${translate('common.and')} `}
            <TextLink href={CONST.WALLET_AGREEMENT_URL}>{`${translate('termsStep.walletAgreement')}.`}</TextLink>
        </Text>
    );
}

function TermsStep() {
    const styles = useThemeStyles();
    const [hasAcceptedDisclosure, setHasAcceptedDisclosure] = useState(false);
    const [hasAcceptedPrivacyPolicyAndWalletAgreement, setHasAcceptedPrivacyPolicyAndWalletAgreement] = useState(false);
    const [error, setError] = useState(false);
    const {translate} = useLocalize();

    const [walletTerms] = useOnyx(ONYXKEYS.WALLET_TERMS);

    const errorMessage = error ? 'common.error.acceptTerms' : ErrorUtils.getLatestErrorMessage(walletTerms ?? {}) ?? '';

    const toggleDisclosure = () => {
        setHasAcceptedDisclosure(!hasAcceptedDisclosure);
    };

    const togglePrivacyPolicy = () => {
        setHasAcceptedPrivacyPolicyAndWalletAgreement(!hasAcceptedPrivacyPolicyAndWalletAgreement);
    };

    /** clear error */
    useEffect(() => {
        if (!hasAcceptedDisclosure || !hasAcceptedPrivacyPolicyAndWalletAgreement) {
            return;
        }

        setError(false);
    }, [hasAcceptedDisclosure, hasAcceptedPrivacyPolicyAndWalletAgreement]);

    return (
        <ScrollView style={[styles.flexGrow1]}>
            <Text style={[styles.textHeadlineLineHeightXXL, styles.ph5]}>{translate('termsStep.checkPlease')}</Text>
            <Text style={[styles.mt3, styles.mb3, styles.ph5, styles.textSupporting]}>{translate('termsStep.agreeToTerms')}</Text>
            <CheckboxWithLabel
                accessibilityLabel={translate('termsStep.haveReadAndAgree')}
                style={[styles.mb4, styles.mt4]}
                onInputChange={toggleDisclosure}
                LabelComponent={HaveReadAndAgreeLabel}
            />
            <CheckboxWithLabel
                accessibilityLabel={translate('termsStep.agreeToThe')}
                onInputChange={togglePrivacyPolicy}
                LabelComponent={AgreeToTheLabel}
            />
            <FormAlertWithSubmitButton
                buttonText={translate('termsStep.enablePayments')}
                onSubmit={() => {
                    if (!hasAcceptedDisclosure || !hasAcceptedPrivacyPolicyAndWalletAgreement) {
                        setError(true);
                        return;
                    }

                    setError(false);
                    BankAccounts.acceptWalletTerms({
                        hasAcceptedTerms: hasAcceptedDisclosure && hasAcceptedPrivacyPolicyAndWalletAgreement,
                        reportID: walletTerms?.chatReportID ?? '',
                    });
                }}
                message={errorMessage}
                isAlertVisible={error || Boolean(errorMessage)}
                isLoading={!!walletTerms?.isLoading}
                containerStyles={[styles.mh0, styles.mv4]}
            />
        </ScrollView>
    );
}

export default TermsStep;
