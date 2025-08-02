import AuthGuard from "@/components/AuthGuard";
import ProfileLayout from "@/components/ProfileLayout";

const Profile = () => {


    return (
        <AuthGuard>
            <ProfileLayout />
        </AuthGuard>
    )

}

export default Profile;