import { Platform, StyleSheet } from 'react-native'
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions'

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: responsiveWidth(5),
        padding: responsiveWidth(3),
        paddingTop: 1,
        // paddingBottom: responsiveHeight(6),
    },
    title: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.8) : responsiveFontSize(2.25),
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '2%',
        marginTop: 0,
        color: '#388e3c',
    },
    underline: {
        height: 1,
        backgroundColor: '#ccc',
        width: '150%',
        alignSelf: 'center',
        marginBottom: responsiveHeight(1),
        opacity: 0.5,
    },
    userName: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.1) : responsiveFontSize(2.25),
        fontWeight: 'bold',
        color: '#000',
        marginVertical: responsiveHeight(0),
        textAlign: 'left',
        marginLeft: '3%',
        marginBottom: '3%',
    },
    sectionLabel: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(1.9) : responsiveFontSize(2),
        color: '#000',
        fontWeight: 'bold',
        marginBottom: responsiveHeight(1),
        textAlign: 'left',
        alignSelf: 'flex-start',
        marginLeft: '3%',
    },
    contributionBoard: {
        backgroundColor: '#fff',
        borderRadius: responsiveWidth(4),
        paddingVertical: responsiveHeight(1.25),
        paddingHorizontal: '2%',
        marginBottom: '3%',
        alignSelf: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.75) },
                shadowOpacity: 0.18,
                shadowRadius: responsiveWidth(3),
            },
            android: {
                elevation: 6,
            },
        }),
    },
    contributionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    contributionBox: {
        width: responsiveWidth(10.5),
        height: responsiveWidth(10.5),
        borderRadius: responsiveWidth(2),
        marginLeft: responsiveWidth(1),
        marginRight: responsiveWidth(1),
        alignItems: 'center',
        justifyContent: 'center',
    },
    Spacer: {
        height: responsiveHeight(1.5),
    },
    petParamRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: '4%',
        width: '100%',
    },
    petParamImageWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        height: responsiveHeight(10),
        marginRight: responsiveWidth(4),
    },
    petParamImage: {
        width: responsiveWidth(25),
        height: responsiveWidth(25),
    },
    petParamInfo: {
        flex: 1,
        justifyContent: Platform.OS === 'android' ? 'flex-start' : 'center',
        height: responsiveHeight(10),
        ...Platform.select({
            android: {
                paddingVertical: 0,
                marginVertical: 0,
                marginTop: -responsiveHeight(0.5),
            },
        }),
    },
    petParamName: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(2.1) : responsiveFontSize(2.25),
        fontWeight: 'bold',
        color: '#388e3c',
        marginBottom: '1%',
        textAlign: 'left',
        ...Platform.select({
            android: {
                lineHeight: responsiveFontSize(2.1) * 1.0,
                paddingVertical: 0,
                marginTop: 0,
            },
            ios: {
                lineHeight: responsiveFontSize(2.25) * 1.1,
            },
        }),
        marginLeft: '5%',
    },
    indicatorColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        ...Platform.select({
            android: {
                justifyContent: 'flex-start',
                paddingVertical: 0,
                marginVertical: 0,
            },
            ios: {
                justifyContent: 'flex-start',
            },
        }),
        marginRight: '5%',
    },
    indicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        ...Platform.select({
            android: {
                height: responsiveHeight(2.5),
                marginBottom: responsiveHeight(0.3),
                margin: 0,
                padding: 0,
            },
            ios: {
                marginBottom: responsiveHeight(0.5),
            },
        }),
    },
    indicatorLabel: {
        fontSize: Platform.OS === 'android' ? responsiveFontSize(1.7) : responsiveFontSize(1.75),
        color: '#333',
        marginRight: responsiveWidth(2.5),
        minWidth: responsiveWidth(15),
        textAlign: 'right',
    },
    indicator: {
        height: responsiveHeight(1.25),
        borderRadius: responsiveWidth(1.25),
        flex: 1,
        minWidth: 0,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.25) },
                shadowOpacity: 0.18,
                shadowRadius: responsiveWidth(1),
            },
            android: {
                elevation: 2,
            },
        }),
        overflow: 'visible',
        position: 'relative',
    },
    toggleContainer: {
        alignItems: 'center',
        marginBottom: responsiveHeight(2),
        width: '100%',
    },
    toggleBackground: {
        width: '100%',
        maxWidth: responsiveWidth(100),
        height: responsiveHeight(5.5),
        backgroundColor: '#fff',
        borderRadius: responsiveHeight(2.75),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: responsiveHeight(0.25) },
                shadowOpacity: 0.12,
                shadowRadius: responsiveWidth(1.5),
            },
            android: {
                elevation: 3,
            },
        }),
    },
    toggleSlider: {
        position: 'absolute',
        top: responsiveHeight(0.5),
        height: responsiveHeight(4.5),
        backgroundColor: '#136229',
        borderRadius: responsiveHeight(2.25),
        zIndex: 1,
    },
    toggleTouchable: {
        flex: 1,
        height: responsiveHeight(5.5),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    toggleText: {
        color: '#136229',
        fontWeight: 'bold',
        fontSize: responsiveFontSize(2),
    },
    activeToggleText: {
        color: '#fff',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: responsiveHeight(1),
        gap: responsiveWidth(2),
    },
    totalLabel: {
        fontSize: responsiveFontSize(1.5),
        color: '#666',
        marginBottom: responsiveHeight(0.25),
    },
    totalValue: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: responsiveFontSize(2.5),
    },
    totalNumber: {
        fontSize: responsiveFontSize(4),
        fontWeight: 'bold',
        color: '#000',
    },
    totalUnit: {
        fontSize: responsiveFontSize(2),
        fontWeight: 'bold',
        color: '#000',
    },
    graphPlaceholder: {
        height: responsiveHeight(22.5),
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: responsiveWidth(3),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: responsiveHeight(3),
    },
    loadingContainer: {
        height: responsiveHeight(10),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: responsiveWidth(3),
        marginBottom: responsiveHeight(3),
    },
    loadingText: {
        fontSize: responsiveFontSize(1.8),
        color: '#666',
        fontWeight: '500',
    },
    closeModalButtonAbsolute: {
        position: 'absolute',
        left: 16,
        bottom: 5,
        backgroundColor: '#b2d8b2',
        width: 64,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    closeModalButtonText: {
        color: '#388e3c',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
})

export default styles
