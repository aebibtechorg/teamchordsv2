/* eslint-disable react/prop-types */

const MainLogo = ({ size = 28, className = "", alt = "Team Chords", ...rest }) => {
    return (
        <img src="/favicon.png" width={size} height={size} className={className} alt={alt} {...rest} />
    );
};

export default MainLogo;